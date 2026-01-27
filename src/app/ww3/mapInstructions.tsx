import Image from "next/image";

export const WW3MapInstructions = () => {
  return (
    <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
      <section>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
            WW3 Map - World War 3 Alliance Simulator
          </h1>
        </header>
        <p className="mb-8 text-gray-600">
          Explore potential World War 3 scenarios with this interactive WW3 map. Select countries for the{" "}
          <span className="text-blue-800">Blue side</span> or{" "}
          <span className="text-red-800">Red side</span> to see how alliances would cascade and nations
          would choose sides in a hypothetical global conflict. This map uses war escalation mode by default
          to show second-order alliance effects.
        </p>
      </section>
      <section className="mb-8 lg:mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 lg:text-3xl">
          Countries have 4 states:
        </h2>
        <ol className="mt-2 list-decimal list-inside bg-white p-6 rounded-lg shadow space-y-3 lg:p-8">
          <li className="color-transition font-medium lg:text-lg">
            Undecided (Variable)
          </li>
          <li className="text-gray-700 font-medium lg:text-lg">
            Neutral (Dark Gray)
          </li>
          <li className="text-blue-800 font-medium lg:text-lg">
            Side A (Dark Blue)
          </li>
          <li className="text-red-800 font-medium lg:text-lg">
            Side B (Dark Red)
          </li>
        </ol>
        <p className="mt-6 text-gray-700 lg:text-lg">
          Click any country (or use the search) to assign it to a side in the conflict.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          <span className="font-bold">How the WW3 Simulation Works</span>:
        </h2>
        <div className="flex flex-col lg:flex-row mx-2 lg:mx-10 my-2">
          <Image
            src="/warimage.png"
            width={200}
            height={200}
            alt="WW3 map showing alliance cascades with Saudi Arabia (blue) and Iran (red) selected"
            className="rounded-full border-2 border-gray-300 shadow-lg self-center"
            sizes="(max-width: 768px) 196px, 200px"
            loading="lazy"
          />
          <p className="text-gray-600 mt-2 p-1 lg:p-4">
            This WW3 map shows how a conflict between two nations could escalate into World War 3 through
            alliance chains. The system predicts how each country would likely choose sides based on their
            existing alliances and friendships. For example, in a conflict between{" "}
            <span className="text-blue-800">Saudi Arabia</span> and{" "}
            <span className="text-red-800">Iran</span>, countries like{" "}
            <span className="color-transition font-medium">Germany</span> might start neutral but eventually
            join <span className="text-blue-800">Saudi Arabia&apos;s</span> side as their key allies do the same.
            This demonstrates how local disputes could grow into World War 3 as nations honor their alliance
            commitments. Mark countries as <span className="text-gray-800 font-medium">Neutral</span> to exclude
            them from the WW3 alliance calculations.
          </p>
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold text-gray-700">
          <span className="font-bold">Popular WW3 Scenarios</span>:
        </h2>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li><strong>USA vs Russia</strong> - Cold War 2.0 scenario with NATO involvement</li>
          <li><strong>USA vs China</strong> - Pacific theater conflict over Taiwan</li>
          <li><strong>Israel vs Iran</strong> - Middle East escalation scenario</li>
          <li><strong>India vs Pakistan</strong> - South Asian nuclear powers in conflict</li>
        </ul>
        <p className="mt-4 text-gray-500 text-sm">
          Use the preset dropdown to quickly load common WW3 scenarios.
        </p>
      </section>
    </article>
  );
};
