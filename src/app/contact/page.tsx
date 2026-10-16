"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import HamburgerMenu from "@/components/HamburgerMenu";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [messageError, setMessageError] = useState("");
  const submittingRef = useRef(false);
  const router = useRouter();

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    emailInput.value = email;

    let nextEmailError = "";
    let nextMessageError = "";

    if (!email) {
      nextEmailError = "メールアドレスを入力してください";
    } else if (emailInput.validity.typeMismatch) {
      nextEmailError = "メールアドレスの形式を確認してください";
    }

    if (!message) {
      nextMessageError = "お問い合わせ内容を入力してください";
    }

    setEmailError(nextEmailError);
    setMessageError(nextMessageError);

    if (nextEmailError || nextMessageError) {
      return;
    }
    formData.set("name", name);
    formData.set("email", email);
    formData.set("message", message);

    submittingRef.current = true;
    setIsSubmitting(true);

    let destination = "/";

    // 移動先の判定に失敗しても、問い合わせの送信は続ける
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        destination = "/dashboard";
      }
    } catch {
      destination = "/";
    }

    try {
      const response = await fetch("https://formspree.io/f/xdeaywyo", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        toast.error(
          response.status === 429
            ? "現在送信を受け付けられません。時間をおいてお試しください。"
            : "送信できませんでした。入力内容を確認して、再度お試しください。",
        );
        return;
      }
    } catch {
      toast.error(
        "送信の完了を確認できませんでした。通信状況を確認してから、再度お試しください。",
      );
      return;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }

    form.reset();
    toast.success("お問い合わせを送信しました");
    router.push(destination);
  };

  return (
    <main className="page-background min-h-[calc(100dvh-94px)] px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-md">
        <h1 className="page-title">お問い合わせ</h1>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl bg-[#f9eaea] px-5 py-5"
        >
          <fieldset disabled={isSubmitting} className="min-w-0 space-y-5">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-sm font-medium text-stone-700"
              >
                お名前（ニックネーム可）
                <span className="ml-2 text-xs font-normal text-stone-500">
                  任意
                </span>
              </label>

              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="nickname"
                maxLength={100}
                placeholder="お名前またはニックネーム"
                className="mt-2 w-full rounded-xl border border-[#d9c5c5] bg-white px-4 py-3 text-base text-stone-700 placeholder:text-stone-400 focus:border-[#b99191] focus:outline-none focus:ring-2 focus:ring-[#d9a3a3]/30"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-medium text-stone-700"
              >
                メールアドレス
                <span className="ml-2 text-xs font-normal text-[#b85f65]">
                  必須
                </span>
              </label>

              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="example@gmail.com"
                aria-describedby="contact-email-help"
                className="mt-2 w-full rounded-xl border border-[#d9c5c5] bg-white px-4 py-3 text-base text-stone-700 placeholder:text-stone-400 focus:border-[#b99191] focus:outline-none focus:ring-2 focus:ring-[#d9a3a3]/30"
              />
              {emailError && (
                <p role="alert" className="mt-1.5 text-xs text-red-500">
                  {emailError}
                </p>
              )}

              <p
                id="contact-email-help"
                className="mt-2 text-xs leading-5 text-stone-500"
              >
                返信を受け取れるメールアドレスを入力してください。
              </p>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="block text-sm font-medium text-stone-700"
              >
                お問い合わせ内容
                <span className="ml-2 text-xs font-normal text-[#b85f65]">
                  必須
                </span>
              </label>

              <textarea
                id="contact-message"
                name="message"
                required
                maxLength={5000}
                rows={7}
                placeholder="お問い合わせ内容をご入力ください"
                className="mt-2 w-full resize-y rounded-xl border border-[#d9c5c5] bg-white px-4 py-3 text-base leading-6 text-stone-700 placeholder:text-stone-400 focus:border-[#b99191] focus:outline-none focus:ring-2 focus:ring-[#d9a3a3]/30"
              />

              {messageError && (
                <p role="alert" className="mt-1.5 text-xs text-red-500">
                  {messageError}
                </p>
              )}
            </div>
            <p className="text-xs leading-5 text-stone-500">
              入力いただいた情報は、お問い合わせへの対応に使用します。
            </p>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting}
            className="button-interaction mt-6 min-h-12 w-full rounded-full bg-[#d9a3a3] px-5 py-3 text-sm font-medium text-white disabled:cursor-wait"
          >
            {isSubmitting ? "送信中…" : "送信する"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-xs leading-5 text-stone-500">
          <p className="break-words">
            ご返信は「〇〇@gmail.com」よりお送りします。
          </p>
          <p>
            お問い合わせ内容によっては、返信までにお時間をいただく場合があります。
          </p>
        </div>
      </div>
    </main>
  );
}
