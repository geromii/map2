import Image from "next/image";
import singleImage from "public/singleimage.png"

export const SingleCountryMapInstructions = () => {
  return (
    <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
      <section>
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
            Interactive Geopolitics Map & Diplomacy Map
          </h1>
        </header>
        <div className="flex">
          <p className="mb-8 text-gray-600">
            This interactive geopolitics map lets you explore diplomatic relationships between countries worldwide. 
            Simply click on any nation to see its international relations visualized through color-coded connections. 
            Countries with strong ties appear in{" "}
            <span className="text-blue-800">blue</span>, while those with tensions show in{" "}
            <span className="text-red-800">red</span>. You can navigate the diplomacy map by selecting different countries 
            to compare how their diplomatic networks and alliances differ.
          </p>
        </div>
      </section>
      <section className="mb-6 lg:mb-8">
        <h2 className="ml-4 text-2xl font-semibold text-gray-800 lg:text-3xl">
          Understanding Diplomatic Relationship Scores on the Geopolitics Map
        </h2>
        <div className="lg:grid lg:grid-cols-3 mt-2 ">
          <p className="mt-6 text-gray-700 lg:text-base text-left lg:text-center lg:ml-10 lg:p-4">
            The color intensity represents the strength of the relationship.
            Clicking any country will highlight its network of relationships.
          </p>
          <Image
            src={singleImage}
            width={220}
            height={220}
            alt="Picture of the map in the single country state, which Russia selected."
            className="rounded-full mx-auto my-3 border-2 border-gray-300 shadow-lg align-middle justify-center hidden lg:block"
            sizes="220px"
            loading="lazy"
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
            sizes="(max-width: 768px) 216px, 220px"
            loading="lazy"
          />
        </div>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl lg:text-3xl ml-4 font-bold text-gray-700">
          Navigating the Diplomacy Map
        </h2>
        <p className="text-gray-600 mt-3 lg:ml-2">
          Click on any country to see its web of international relationships unfold on this diplomacy map. 
          You can compare how different nations relate to the world by selecting various countries, 
          which helps reveal how geography and politics shape global geopolitical connections.
        </p>
      </section>
      <section className="mb-6">
        <h2 className="text-2xl lg:text-3xl ml-4 font-bold text-gray-700">
          How This Works
        </h2>
        <p className="text-gray-600 mt-3 lg:ml-2">
          This map is created by querying GPT-5 five times for all country pairs (20,000 pairs in total). 
          GPT-5 is asked to summarize the relationships between the two countries, then conclude with a 
          numeric score that represents the relationship. I do this five times, extract the scores, and 
          average the results to produce the final relationship score you see visualized on the map.
        </p>
        <p className="text-gray-600 mt-3 lg:ml-2">
          The underlying dataset is AI-generated synthetic data originating from GPT-5, generated on August 18, 2025. 
          GPT-5&apos;s knowledge cutoff is September 30, 2024, significant events occurring after that date, such as 
          Trump&apos;s election or Syria&apos;s regime change, are included by providing GPT-5 with the relevant information. 
          Although I make every effort to stay on top of relevant events, some events may have been omitted. 
          Future versions will take a more systematic approach to handling this.
        </p>
      </section>
    </article>
  );
};
