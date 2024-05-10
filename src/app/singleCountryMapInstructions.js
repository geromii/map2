export const SingleCountryMapInstructions = () => {
    return (
      <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
        <section>
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
              How to use the Geopolitics Map
            </h1>
          </header>
          <p className="mb-8 text-gray-600">
            Click any country on the map to view its diplomatic relationships with other nations. 
            Friendly relationships will appear in <span className="text-blue-800">blue</span>, 
            while less favorable relationships will be shown in <span className="text-red-800">red</span>. 
            You can quickly switch between countries by clicking another nation to see its geopolitical relationship map.
          </p>
        </section>
        <section className="mb-8 lg:mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 lg:text-3xl">
            Understanding Relationship Scores:
          </h2>
          <ul className="mt-2 list-disc list-inside bg-white p-6 rounded-lg shadow space-y-3 lg:p-8">
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
          <p className="mt-6 text-gray-700 lg:text-lg">
            The color intensity represents the strength of the relationship. Clicking any country will highlight 
            its network of relationships.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            <span className="font-bold">Map Navigation</span>:
          </h2>
          <p className="text-gray-600 mt-2">
            Click a country to view its direct relationship map. You can click on different countries 
            to compare how each one&apos;s relationships change across different regions and contexts.
          </p>
        </section>
      </article>
    );
  };
