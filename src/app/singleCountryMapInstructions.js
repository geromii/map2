import Image from "next/image";

export const SingleCountryMapInstructions = () => {
  return (
    <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
      <section>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
            How to use the Geopolitics Map
          </h1>
        </header>
        <div className="flex">
          <p className="mb-8 text-gray-600">
            Click any country on the map to view its diplomatic relationships
            with other nations. Friendly relationships will appear in{" "}
            <span className="text-blue-800">blue</span>, while less favorable
            relationships will be shown in{" "}
            <span className="text-red-800">red</span>. You can quickly switch
            between countries by clicking another nation to see its geopolitical
            relationship map.
          </p>
        </div>
      </section>
      <section className="mb-6 lg:mb-8">
        <h2 className="ml-4 text-2xl font-semibold text-gray-800 lg:text-3xl">
          Understanding Relationship Scores
        </h2>
        <div className="lg:grid lg:grid-cols-3 mt-2 ">
          <p className="mt-6 text-gray-700 lg:text-base text-left lg:text-center lg:ml-10 lg:p-4">
            The color intensity represents the strength of the relationship.
            Clicking any country will highlight its network of relationships.
          </p>
          <Image
            src="/singleimage.png"
            width={220}
            height={220}
            alt="Picture of the map in the single country state, which Russia selected."
            className="rounded-full mx-auto my-3 border-2 border-gray-300 shadow-lg align-middle justify-center hidden lg:block"
            priority={true}
          />
          <ul className="mt-4 list-disc list-inside bg-white p-6 rounded-lg shadow space-y-3 lg:p-8 my-auto">
            <li className="text-blue-800 font-medium lg:text-lg">
              Friendly (Blue)
            </li>
            <li className="text-gray-700 font-medium lg:text-lg">
              Neutral (Gray)
            </li>
            <li className="text-red-800 font-medium lg:text-lg">
              Unfriendly (Red)
            </li>
          </ul>
          <Image
            src="/singleimage.png"
            width={220}
            height={220}
            alt="Picture of the map in the single country state, which Russia selected."
            className="rounded-full mx-auto my-3 border-2 border-gray-300 shadow-lg align-middle justify-center lg:hidden"
            priority={true}
          />
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl lg:text-3xl ml-4 font-bold text-gray-700">
          Map Navigation
        </h2>
        <p className="text-gray-600 mt-3 lg:ml-2">
          Click a country to view its direct relationship map. You can click on
          different countries to compare how each one&apos;s relationships
          change across different regions and contexts.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl lg:text-3xl ml-4 font-bold text-gray-700">
          Data Source
        </h2>
        <p className="text-gray-600 mt-3 lg:ml-2">
        The underlying dataset is AI-generated synethic data using GPT-3.5 and GPT-4 to produce a summary, and a score, of each relationship. The results are averaged across runs to produce the final score.
        </p>
      </section>
    </article>
  );
};
