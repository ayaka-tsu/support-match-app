"use client";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function TermsPage() {
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
            <h1 className="text-xl font-medium text-stone-700">利用規約</h1>
            <div className="mt-6 space-y-6 text-sm leading-7 text-stone-500">
              <section>
                <h2 className="font-medium text-stone-700">
                  第1条　本サービスについて
                </h2>
                <p className="mt-2">
                  本サービス「見てて」は、同じ場所にいる利用者同士が、短時間の見守りやサポートを必要とする方と、サポートできる方としてつながる機会を提供するマッチングサービスです。
                </p>
                <p className="mt-2">
                  本サービスの運営者は、利用者同士のサポートそのものを提供する者ではなく、利用者間で行われるサポートの当事者ではありません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">第2条　利用条件</h2>
                <p className="mt-2">
                  本サービスを利用できる方は、18歳以上の方とします。
                </p>
                <p className="mt-2">
                  利用者は、自らの責任において本サービスを利用するものとします。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第3条　サポートについて
                </h2>
                <p className="mt-2">
                  サポートは、保護者がその場にいる状態で行うものとします。
                </p>
                <p className="mt-2">
                  具体的なサポート内容、開始・終了のタイミング、サポート時間その他必要な事項については、利用者同士で確認し、双方の合意のうえで決定してください。
                </p>
                <p className="mt-2">
                  本サービス上のマッチング状態の継続時間は、実際のサポート時間を定めるものではありません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第4条　金銭のやり取りについて
                </h2>
                <p className="mt-2">
                  本サービスを利用したサポートについて、利用者同士で報酬その他の金銭を授受することはできません。
                </p>
                <p className="mt-2">
                  本サービスは、有償の託児、ベビーシッターその他これらに類するサービスを提供するものではありません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第5条　利用店舗について
                </h2>
                <p className="mt-2">
                  利用者が本サービスを利用する店舗その他の施設は、本サービスの運営者ではなく、利用者間のサポートや約束の当事者でもありません。
                </p>
                <p className="mt-2">
                  利用者は、店舗または施設のルールや他の利用者への配慮を守って本サービスを利用してください。
                </p>
                <p className="mt-2">
                  店舗または施設に対し、本サービス上のマッチング、サポートまたは利用者間のトラブルへの対応を求めることはできません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第6条　メッセージ機能について
                </h2>
                <p className="mt-2">
                  利用者は、本サービス内のメッセージ機能を、マッチング後のサポート内容や時間等を確認するために利用することができます。
                </p>
                <p className="mt-2">
                  本サービス内では、電話番号、メールアドレス、LINEその他のSNSアカウント、QRコードその他外部で直接連絡するための情報を送信または掲載してはいけません。
                </p>
                <p className="mt-2">
                  利用者が、本サービス外で本人同士の判断により連絡先を交換することについて、運営者は関与または管理しません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">第7条　禁止事項</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>虚偽の情報を登録する行為</li>
                  <li>他人になりすます行為</li>
                  <li>相手に迷惑、不安または不快感を与える行為</li>
                  <li>営業、勧誘、宣伝その他本サービスの目的と異なる利用</li>
                  <li>
                    出会いその他、本サービスが想定するサポート以外を主な目的として利用する行為
                  </li>
                  <li>
                    相手または子どもの個人情報、写真その他の情報を本人の同意なく公開する行為
                  </li>
                  <li>本サービス内で外部連絡先を交換する行為</li>
                  <li>金銭の授受を伴うサポートを行う行為</li>
                  <li>法令または公序良俗に反する行為</li>
                  <li>
                    その他、運営者が本サービスの目的に照らして不適切と判断する行為
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第8条　利用の制限・停止
                </h2>
                <p className="mt-2">
                  利用者が本規約に違反した場合、または本サービスの適切な運営に支障を及ぼす行為が確認された場合、運営者は必要に応じて本サービスの利用を制限または停止することがあります。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第9条　利用者間のトラブル
                </h2>
                <p className="mt-2">
                  利用者同士で行われるサポートの内容や約束については、利用者同士で十分に確認してください。
                </p>
                <p className="mt-2">
                  利用者間でトラブルが発生した場合は、原則として当事者間で解決するものとします。
                </p>
                <p className="mt-2">
                  ただし、運営者に責任がある場合まで、その責任を免除するものではありません。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第10条　安全について
                </h2>
                <p className="mt-2">
                  本サービスは、利用者同士がつながる機会を提供するものであり、個々の利用者の行為、サポート内容または子どもの安全を保証するものではありません。
                </p>
                <p className="mt-2">
                  利用者は、その場の状況や相手との確認内容を踏まえ、自らの判断と責任において利用してください。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第11条　個人情報等の取扱い
                </h2>
                <p className="mt-2">
                  本サービスにおける個人情報、位置情報その他の利用者情報の取扱いについては、別途定めるプライバシーポリシーによるものとします。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第12条　本サービスの変更・停止
                </h2>
                <p className="mt-2">
                  運営者は、必要に応じて本サービスの内容を変更し、または提供を一時的もしくは恒久的に停止することがあります。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">
                  第13条　本規約の変更
                </h2>
                <p className="mt-2">
                  運営者は、本サービスの内容や運営状況等に応じて、本規約を変更することがあります。
                </p>
                <p className="mt-2">
                  変更後の規約は、本サービス上で表示した時点から適用されるものとします。
                </p>
              </section>

              <section>
                <h2 className="font-medium text-stone-700">第14条　準拠法</h2>
                <p className="mt-2">本規約は、日本法に準拠するものとします。</p>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
