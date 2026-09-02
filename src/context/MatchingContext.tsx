"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type CurrentPosition = {
  latitude: number;
  longitude: number;
  capturedAt: number;
};

type MatchingContextValue = {
  checkForMatching: () => Promise<void>;
};

const MatchingContext = createContext<MatchingContextValue | null>(null);

export function useMatching() {
  const context = useContext(MatchingContext);

  if (!context) {
    throw new Error("useMatching must be used within MatchingProvider");
  }

  return context;
}

const toRadians = (value: number) => {
  return (value * Math.PI) / 180;
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const positionRef = useRef<CurrentPosition | null>(null);

  const getCurrentPosition = useCallback(async () => {
    const cachedPosition = positionRef.current;

    if (cachedPosition && Date.now() - cachedPosition.capturedAt < 30 * 1000) {
      return cachedPosition;
    }

    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      },
    );

    const currentPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      capturedAt: Date.now(),
    };

    positionRef.current = currentPosition;

    return currentPosition;
  }, []);

  const checkForMatching = useCallback(async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("matching session error:", sessionError.message);
      return;
    }

    if (!session) return;

    const user = session.user;

    const thirtyMinutesAgo = new Date(
      Date.now() - 30 * 60 * 1000,
    ).toISOString();

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("support_available")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("profile check error:", profileError.message);
      return;
    }

    const { data: ownRequests, error: ownRequestError } = await supabase
      .from("support_requests")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", thirtyMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ownRequestError) {
      console.error("support request check error:", ownRequestError.message);
      return;
    }

    const hasOwnRequest = !!ownRequests && ownRequests.length > 0;
    const isSupportAvailable = profileData?.support_available === true;

    if (!hasOwnRequest && !isSupportAvailable) {
      return;
    }

    let currentPosition: CurrentPosition;

    try {
      currentPosition = await getCurrentPosition();
    } catch (error) {
      console.error("location get error:", error);
      return;
    }

    const currentLatitude = currentPosition.latitude;
    const currentLongitude = currentPosition.longitude;
    const locationUpdatedAt = new Date(
      currentPosition.capturedAt,
    ).toISOString();

    // サポートする側なら、自分の現在地を profiles に更新
    if (isSupportAvailable) {
      const { error: profileLocationError } = await supabase
        .from("profiles")
        .update({
          latitude: currentLatitude,
          longitude: currentLongitude,
          location_updated_at: locationUpdatedAt,
        })
        .eq("id", user.id);

      if (profileLocationError) {
        console.error(
          "profile location update error:",
          profileLocationError.message,
        );
        return;
      }
    }

    // サポート依頼を出した側なら、自分の依頼の現在地を更新
    if (hasOwnRequest) {
      const activeRequest = ownRequests[0];

      const { error: requestLocationError } = await supabase
        .from("support_requests")
        .update({
          latitude: currentLatitude,
          longitude: currentLongitude,
          location_updated_at: locationUpdatedAt,
        })
        .eq("id", activeRequest.id);

      if (requestLocationError) {
        console.error(
          "request location update error:",
          requestLocationError.message,
        );
        return;
      }

      const { data: existingMatching, error: existingMatchingError } =
        await supabase
          .from("matchings")
          .select("id")
          .eq("support_request_id", activeRequest.id)
          .maybeSingle();

      if (existingMatchingError) {
        console.error(
          "existing matching error:",
          existingMatchingError.message,
        );
        return;
      }

      if (!existingMatching) {
        const { data: supporters, error: supportersError } = await supabase
          .from("profiles")
          .select("id, latitude, longitude, location_updated_at")
          .eq("support_available", true)
          .neq("id", user.id);

        if (supportersError) {
          console.error("supporters check error:", supportersError.message);
          return;
        }

        const nearbySupporter = supporters?.find((supporter) => {
          if (supporter.latitude === null || supporter.longitude === null) {
            return false;
          }

          const distance = getDistance(
            currentLatitude,
            currentLongitude,
            supporter.latitude,
            supporter.longitude,
          );

          return distance <= 100;
        });

        if (nearbySupporter) {
          const { error: createMatchingError } = await supabase
            .from("matchings")
            .insert({
              support_request_id: activeRequest.id,
              supporter_id: nearbySupporter.id,
              status: "active",
              updated_at: new Date().toISOString(),
            });

          if (createMatchingError) {
            if (createMatchingError.code !== "23505") {
              console.error(
                "matching create error:",
                createMatchingError.message,
              );
            }
          } else {
            const { error: supportOffError } = await supabase
              .from("profiles")
              .update({
                support_available: false,
              })
              .eq("id", nearbySupporter.id);

            if (supportOffError) {
              console.error("support off error:", supportOffError.message);
            }
          }
        }
      }
    }

    // サポートする側からも、近くのサポート依頼を探す
    if (isSupportAvailable) {
      const { data: requests, error: requestsError } = await supabase
        .from("support_requests")
        .select("id, user_id, latitude, longitude, location_updated_at")
        .neq("user_id", user.id)
        .gte("created_at", thirtyMinutesAgo);

      if (requestsError) {
        console.error("nearby requests check error:", requestsError.message);
        return;
      }

      if (!requests || requests.length === 0) {
        return;
      }

      const requestIds = requests.map((request) => request.id);

      const { data: alreadyMatchedRequests, error: alreadyMatchedError } =
        await supabase
          .from("matchings")
          .select("support_request_id")
          .in("support_request_id", requestIds);

      if (alreadyMatchedError) {
        console.error(
          "existing request matching error:",
          alreadyMatchedError.message,
        );
        return;
      }

      const matchedRequestIds = new Set(
        alreadyMatchedRequests?.map(
          (matching) => matching.support_request_id,
        ) ?? [],
      );

      const nearbyRequest = requests.find((request) => {
        if (matchedRequestIds.has(request.id)) {
          return false;
        }

        if (request.latitude === null || request.longitude === null) {
          return false;
        }

        const distance = getDistance(
          currentLatitude,
          currentLongitude,
          request.latitude,
          request.longitude,
        );

        return distance <= 100;
      });

      if (!nearbyRequest) {
        return;
      }

      const { error: createMatchingError } = await supabase
        .from("matchings")
        .insert({
          support_request_id: nearbyRequest.id,
          supporter_id: user.id,
          status: "active",
          updated_at: new Date().toISOString(),
        });

      if (createMatchingError) {
        if (createMatchingError.code !== "23505") {
          console.error("matching create error:", createMatchingError.message);
        }
        return;
      }

      const { error: supportOffError } = await supabase
        .from("profiles")
        .update({
          support_available: false,
        })
        .eq("id", user.id);

      if (supportOffError) {
        console.error("support off error:", supportOffError.message);
      }
    }
  }, [getCurrentPosition]);

  useEffect(() => {
    void checkForMatching();

    const intervalId = window.setInterval(() => {
      void checkForMatching();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkForMatching, pathname]);

  return (
    <MatchingContext.Provider value={{ checkForMatching }}>
      {children}
    </MatchingContext.Provider>
  );
}
