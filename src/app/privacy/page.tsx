"use client";

import HamburgerMenu from "@/components/HamburgerMenu";

export default function PrivacyPage() {
  return (
    <main
      className="h-[calc(100dvh-94px)] overflow-y-auto bg-no-repeat px-6 py-6"
      style={{
        background:
          "linear-gradient(to bottom, #f8f6f4 0%, #f8f6f4 60%, #f6eeee 78%, #efdcdc 90%, #e8caca 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-end">
          <HamburgerMenu />
        </div>

        <div className="relative mt-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="absolute -left-6 top-3 flex h-8 w-8 items-center justify-center text-[#c98f98]"
            aria-label="前の画面に戻る"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
              <path
                d="M15 5L8 12L15 19"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-xl font-medium text-stone-700">
              プライバシーポリシー
            </h1>

            <p className="mt-4 text-sm leading-7 text-stone-500">
              「見てて」（以下「本サービス」といいます。）では、利用者の情報を以下のとおり取り扱います。
            </p>

            <div className="mt-6 space-y-6 text-sm leading-7 text-stone-500">
              <section>
                <h2 className="font-medium text-stone-700">
                  第1条　取得する情報
                </h2>
                <p className="mt-2">
                  本サービスでは、サービスの提供に必要な範囲で、以下の情報を取得します。
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>メールアドレス</li>
                  <li>ニックネーム</li>
                  <li>プロフィール画像</li>
                  <li>位置情報</li>
                  <li>サポート依頼、マッチング等の利用履歴</li>
                  <li>本サービス内で送受信されたメッセージ</li>
                  <li>その他、利用者が本サービス上で入力または送信した情報</li>
                </ul>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">第2条　利用目的</h2>
                <p className="mt-2">取得した情報は、以下の目的で利用します。</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>利用者の登録、認証およびアカウント管理のため</li>
                  <li>利用者のプロフィールを表示するため</li>
                  <li>近くにいる利用者同士をマッチングするため</li>
                  <li>サポート依頼およびマッチング状態を管理するため</li>
                  <li>利用者同士のメッセージ機能を提供するため</li>
                  <li>通知等、本サービスに必要な機能を提供するため</li>
                  <li>不正利用や本規約に違反する行為の確認および対応のため</li>
                  <li>問い合わせへの対応のため</li>
                  <li>本サービスの維持、改善および不具合対応のため</li>
                </ul>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第3条　位置情報について
                </h2>
                <p className="mt-2">
                  本サービスでは、近くにいる利用者同士をマッチングするために位置情報を利用します。
                </p>
                <p className="mt-2">
                  取得した位置情報は、サポート依頼中またはサポート可能な状態にある利用者同士の距離を確認し、マッチング判定を行うために使用します。
                </p>
                <p className="mt-2">
                  位置情報は、本サービスの目的以外で利用しません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第4条　利用者間で表示される情報
                </h2>
                <p className="mt-2">
                  本サービスでは、マッチングやメッセージ機能の提供に必要な範囲で、ニックネームやプロフィール画像等の情報が他の利用者に表示される場合があります。
                </p>
                <p className="mt-2">
                  メールアドレスや位置情報そのものを、他の利用者に表示することはありません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第5条　メッセージについて
                </h2>
                <p className="mt-2">
                  本サービス内で送受信されたメッセージは、利用者同士の連絡機能を提供するために保存されます。
                </p>
                <p className="mt-2">
                  また、本規約に違反する行為、不正利用またはトラブルへの対応が必要な場合、運営者が必要な範囲で確認することがあります。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第6条　第三者への提供
                </h2>
                <p className="mt-2">
                  運営者は、法令に基づく場合その他正当な理由がある場合を除き、利用者の個人情報を本人の同意なく第三者に提供しません。
                </p>
                <p className="mt-2">
                  ただし、本サービスの提供に必要なシステムやサービスの運営を外部のサービス提供者に委託する場合があります。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第7条　情報の管理
                </h2>
                <p className="mt-2">
                  運営者は、取得した情報について、不正アクセス、漏えい、紛失等を防止するため、適切な管理に努めます。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第8条　情報の確認・変更等
                </h2>
                <p className="mt-2">
                  利用者は、本サービス上で変更可能なプロフィール情報について、自ら確認または変更することができます。
                </p>
                <p className="mt-2">
                  その他、利用者情報の取扱いに関する問い合わせについては、運営者が別途定める問い合わせ窓口にて対応します。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第9条　本ポリシーの変更
                </h2>
                <p className="mt-2">
                  運営者は、本サービスの内容や運営状況等に応じて、本ポリシーを変更することがあります。
                </p>
                <p className="mt-2">
                  変更後の内容は、本サービス上で表示した時点から適用されるものとします。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第10条　お問い合わせ
                </h2>
                <p className="mt-2">
                  本サービスにおける利用者情報の取扱いに関するお問い合わせは、別途案内する問い合わせ窓口よりご連絡ください。
                </p>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
