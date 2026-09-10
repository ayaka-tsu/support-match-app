import HamburgerMenu from "@/components/HamburgerMenu";

export default function ConceptPage() {
  return (
    <main className="page-background min-h-[calc(100dvh-94px)] overflow-x-hidden px-6 py-6">
      <HamburgerMenu />

      <div className="mx-auto w-full max-w-2xl">
        <h1 className="page-title">コンセプト</h1>

        <section className="mt-8 rounded-3xl border border-[#ead6d6] bg-[#fffafa] px-6 py-8 sm:px-8">
          <p className="text-lg font-medium text-[#a97d7d]">
            𓂃𓈒𓏸 ほんの少し、見ててもらえたら 𓂃𓈒𓏸
          </p>

          <div className="mt-6 ml-8 space-y-5 text-sm leading-7 text-stone-600">
            <p>
              子どもが小さいと、
              <br />
              ほんの数分、ほんの数秒でも
              <br />
              目を離せないことがある。
            </p>

            <p>
              料理を取りに行きたい。
              <br />
              少し席を離れたい。
              <br />
              ちょっとだけ、ひと息つきたい。
            </p>

            <p>
              誰かに頼むほどではない。
              <br />
              でも、ひとりで全部やるには少し大変。
            </p>

            <p>
              そんな小さな「ちょっと」が、
              <br />
              毎日の中で何度も重なっていく。
            </p>

            <p>
              <span className="font-medium text-[#a97d7d]">見てて</span>は、
              <br />
              助けてほしい人と、
              <br />
              少しなら手を貸せる人をつなぐアプリ。
            </p>

            <p>
              頼みたい気持ちと、
              <br />
              そっと力になりたい、の気持ちが
              <br />
              自然に出会えるように。
            </p>

            <p>
              サポートされる側にも、
              <br />
              サポートする側にも、
              <br />
              少しあたたかい時間が残る。
            </p>

            <p className="font-medium text-stone-700">
              「ちょっと見てて」が、言いやすくなるためのアプリです。
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#ead6d6] bg-[#fffafa] px-6 py-7 sm:px-8">
          <h2 className="text-lg font-medium text-[#a97d7d]">見てての使い方</h2>
          <div className="mt-6 space-y-6">
            <div className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c96f6f]" />

              <div>
                <p className="font-medium text-stone-700">ニックネームを登録</p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  まずはニックネームを設定します。
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c96f6f]" />

              <div>
                <p className="font-medium text-stone-700">
                  近くにいる人とつながる
                </p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  サポートをお願いしたい人と、サポートできる人をつなぎます。
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#c96f6f]" />

              <div>
                <p className="font-medium text-stone-700">
                  やり取りが終わったあとも少し安心
                </p>

                <p className="mt-1 text-sm leading-6 text-stone-600">
                  終了後もしばらくは、相手とメッセージをやり取りできます。
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
