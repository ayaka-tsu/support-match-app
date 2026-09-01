"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import HamburgerMenu from "@/components/HamburgerMenu";
import Image from "next/image";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

const supabase = createClient();

export default function EditProfilePage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(
    null,
  );
  const [shouldDeleteAvatar, setShouldDeleteAvatar] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error.message);
        return;
      }
      setEmail(data.user.email ?? "");
      setOriginalEmail(data.user.email ?? "");
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("nickname, support_available, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(profileError.message);
        return;
      }

      if (!profileData) {
        return;
      }
      setNickname(profileData.nickname);
      setAvatarUrl(profileData.avatar_url);
      setOriginalAvatarUrl(profileData.avatar_url);
      setIsProfileLoaded(true);
    };
    getUser();
  }, []);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropConfirm = useCallback(async () => {
    if (!cropImage || !croppedAreaPixels || !avatarFile) return;

    const image = document.createElement("img");
    image.src = cropImage;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject();
    });

    const canvas = document.createElement("canvas");
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!blob) return;

    const croppedFile = new File([blob], avatarFile.name, {
      type: "image/jpeg",
    });

    setAvatarFile(croppedFile);
    setCropImage(URL.createObjectURL(croppedFile));
    setIsCropOpen(false);
  }, [avatarFile, cropImage, croppedAreaPixels]);

  const handleSave = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error(userError.message);
      return;
    }

    if (!user) return;

    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        toast.error("新しいパスワードは8文字以上で入力してください");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("新しいパスワードが一致していません");
        return;
      }
    }

    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passwordError) {
        toast.error("パスワードを変更できませんでした");
        console.error(passwordError.message);
        return;
      }
    }

    let avatarUrl: string | undefined;

    if (avatarFile) {
      const fileExtension = avatarFile.name.split(".").pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile);

      if (uploadError) {
        console.error(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        nickname: nickname,
        ...(shouldDeleteAvatar
          ? { avatar_url: null }
          : avatarUrl
            ? { avatar_url: avatarUrl }
            : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error(error.message);
      return;
    }

    if (originalAvatarUrl && (shouldDeleteAvatar || avatarUrl)) {
      const oldAvatarPath = originalAvatarUrl.split("/avatars/")[1];

      if (oldAvatarPath) {
        const { error: deleteAvatarError } = await supabase.storage
          .from("avatars")
          .remove([oldAvatarPath]);

        if (deleteAvatarError) {
          console.error("avatar delete error:", deleteAvatarError.message);
        }
      }
    }

    if (email !== originalEmail) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email,
      });

      if (emailError) {
        toast.error("メールアドレスを変更できませんでした");
        console.error(emailError.message);
        return;
      }
    }
    if (email !== originalEmail) {
      if (newPassword) {
        toast.success(
          "プロフィールとパスワードを更新しました。メールアドレスの変更は確認メールから完了してください",
        );
      } else {
        toast.success(
          "プロフィールを更新しました。メールアドレスの変更は確認メールから完了してください",
        );
      }
    } else if (newPassword) {
      toast.success("プロフィールとパスワードを更新しました");
    } else {
      toast.success("プロフィールを更新しました");
    }

    router.push("/profile");
  };

  return (
    <main>
      <HamburgerMenu />

      <h1>プロフィール編集</h1>

      <>
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            {!isProfileLoaded ? null : cropImage ? (
              <Image
                src={cropImage}
                alt="プロフィール画像プレビュー"
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="プロフィール画像"
                width={56}
                height={56}
                unoptimized
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d9a3a3] text-xl font-medium text-white">
                {nickname ? nickname.charAt(0).toUpperCase() : "?"}
              </div>
            )}

            <label className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 cursor-pointer items-center justify-center rounded-full bg-white shadow">
              <svg
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5 text-stone-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 7.5h1.5l1.125-1.5h5.25l1.125 1.5h1.5A2.25 2.25 0 0 1 19.5 9.75v6A2.25 2.25 0 0 1 17.25 18h-10.5A2.25 2.25 0 0 1 4.5 15.75v-6A2.25 2.25 0 0 1 6.75 7.5Z"
                />
                <circle cx="12" cy="12.75" r="2.25" />
              </svg>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;

                  if (!file) return;

                  setShouldDeleteAvatar(false);
                  setAvatarFile(file);
                  setCropImage(URL.createObjectURL(file));
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setIsCropOpen(true);
                }}
              />
            </label>

            {avatarUrl && (
              <button
                type="button"
                onClick={() => {
                  setShouldDeleteAvatar(true);
                  setAvatarFile(null);
                  setCropImage(null);
                  setAvatarUrl(null);
                }}
                className="absolute -bottom-0.5 -left-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white shadow"
                aria-label="プロフィール画像を削除"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-2.5 w-2.5 text-stone-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 3.75h6m-8.25 3h10.5m-9.75 0 .75 12h7.5l.75-12M10 10.5v5.25m4-5.25v5.25"
                  />
                </svg>
              </button>
            )}
          </div>

          <p className="mt-2 text-xs text-stone-500">画像を変更</p>
        </div>
        {isCropOpen && cropImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-[280px] rounded-2xl bg-white p-3">
              <h2 className="mb-3 text-center text-sm font-medium text-stone-700">
                プロフィール画像を調整
              </h2>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="mt-3 px-1">
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setCropImage(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setIsCropOpen(false);
                  }}
                  className="button-interaction flex-1 rounded-full bg-stone-200 px-3 py-2 text-sm text-stone-600"
                >
                  キャンセル
                </button>

                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="button-interaction flex-1 rounded-full bg-[#d9a3a3] px-3 py-2 text-sm text-white"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        )}
      </>

      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label>新しいパスワード</label>
      <input
        type="password"
        placeholder="新しいパスワード"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <p>8文字以上で入力してください</p>

      <label>新しいパスワード（確認）</label>
      <input
        type="password"
        placeholder="もう一度入力してください"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      <button onClick={handleSave}>保存</button>
    </main>
  );
}
