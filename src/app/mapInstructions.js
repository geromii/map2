export const MapInstructions = () => {
    return (
      <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
        <section>
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
              How to use
            </h1>
          </header>
          <p className="mb-8 text-gray-600">
            Click countries on the map until you have at least one country on the{" "}
            <span className="text-red-800">Red side</span> (click once), and at
            least one country on the{" "}
            <span className="text-blue-800">Blue side</span> (click twice). You
            will then see a global opinion map.
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
            <li className="text-red-800 font-medium lg:text-lg">
              Side A (Dark Red)
            </li>
            <li className="text-blue-800 font-medium lg:text-lg">
              Side B (Dark Blue)
            </li>
            <li className="text-gray-700 font-medium lg:text-lg">
              Neutral (Dark Gray)
            </li>
          </ol>
          <p className="mt-6 text-gray-700 lg:text-lg">
            Clicking a country (or selecting it through the search) will cycle its
            state.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            <span className="font-bold">Geopolitics Mode</span>:
          </h2>
          <p className="text-gray-600 mt-2">
            When <span className="font-bold">Geopolitics Mode</span> is on and
            there is at least one country in each of{" "}
            <span className="text-red-800">Side A</span> and{" "}
            <span className="text-blue-800">Side B</span>, every country in the
            undecided state receives a probability of siding with either{" "}
            <span className="text-red-800">Side A</span> or{" "}
            <span className="text-blue-800">Side B</span> depending on its
            relationships with the respective sides. Each country&apos;s
            probability of siding with <span className="text-red-800">A</span> or{" "}
            <span className="text-blue-800">B</span> will be reflected by their
            color on the map.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-gray-700">
            <span className="font-bold">War Outbreak Mode</span>:
          </h2>
          <p className="text-gray-600 mt-2">
            When <span className="font-bold">War Outbreak Mode</span> is on the
            calculation gets more complex. Instead, the countries in the undecided
            state now receive a predicted side according to what their allies
            think about the conflict (the second order relationship). For example,{" "}
            <span className="color-transition font-medium">Germany</span> may not
            initially take a side if{" "}
            <span className="text-red-800">Saudi Arabia</span> and{" "}
            <span className="text-blue-800">Iran</span> go to war, but when all of
            its major allies side with{" "}
            <span className="text-red-800">Saudi Arabia</span>, they are much more
            inclined to do the same. However, if an ally is in the{" "}
            <span className="text-gray-800 font-medium">Neutral</span> state then
            that country will be excluded from the calculation.
          </p>
        </section>
        <br></br>
        <p className="text-xs">Made by Jeremy Russell, 2024.</p>
      </article>
    );
  };