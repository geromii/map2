import Image from "next/image";

export const MapInstructions = () => {
    return (
      <article className="max-w-4xl mx-auto px-5 py-8 lg:max-w-6xl lg:px-8">
        <section>
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 lg:text-4xl">
              Diplomatic Conflicts Map & WW3 Map Simulator
            </h1>
          </header>
          <p className="mb-8 text-gray-600">
            Build hypothetical conflict scenarios using this interactive map. Choose which countries join the{" "}
            <span className="text-blue-800">Blue side</span> or{" "}
            <span className="text-red-800">Red side</span> to see how diplomatic alignments might play out globally. 
            Turn on War Escalation Mode to explore how this could become a WW3 map with potential World War 3 alliance patterns.
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
            Clicking a country (or selecting it through the search) will allow you to change its side.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">
            <span className="font-bold">Geopolitics Mode</span>:
          </h2>
          <div className = "flex flex-col lg:flex-row mx-2 lg:mx-10 my-2 ">
          <Image src="/conflictimage.png" width={200} height={200} alt="An image of the map with Saudi Arabia (blue) and Iran (red) selected, display most of Europe as neutral but the UK shaded blue and Russia shaded red." className = "rounded-full border-2 border-gray-300 shadow-lg self-center" sizes="(max-width: 768px) 196px, 200px" loading="lazy"/>
          <p className="text-gray-600 mt-2 p-1 lg:p-4">
            When <span className="font-bold">Predictions</span> are on and
            there is at least one country in each of{" "}
            <span className="text-blue-800">Side A</span> and{" "}
            <span className="text-red-800">Side B</span>, every country in the
            undecided state receives a probability of siding with either{" "}
            <span className="text-blue-800">Side A</span> or{" "}
            <span className="text-red-800">Side B</span> depending on its
            relationships with the respective sides. Each country&apos;s
            probability of siding with <span className="text-blue-800">A</span> or{" "}
            <span className="text-red-800">B</span> will be reflected by their
            color on the map.
          </p>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-gray-700">
            <span className="font-bold">War Escalation Mode - WW3 Map & World War 3 Scenarios</span>:
          </h2>
          <div className = "flex flex-col lg:flex-row mx-2 lg:mx-10 my-2 ">
          <Image src="/warimage.png" width={200} height={200} alt="An image of the map with Saudi Arabia (blue) and Iran (red), with war mode turned on, showing most of Europe now shaded blue." className = "rounded-full border-2 border-gray-300 shadow-lg self-center" sizes="(max-width: 768px) 196px, 200px" loading="lazy"/>
          <p className="text-gray-600 mt-2 p-1 lg:p-4">
            When you enable <span className="font-bold">War Escalation Mode</span>, the diplomatic conflict map becomes a 
            WW3 map simulator that shows how potential World War 3 scenarios might unfold. The system predicts 
            how nations would likely choose sides based on their existing alliances and friendships. Take a conflict between{" "}
            <span className="text-blue-800">Saudi Arabia</span> and{" "}
            <span className="text-red-800">Iran</span> – countries like <span className="color-transition font-medium">Germany</span> might 
            start neutral but eventually join <span className="text-blue-800">Saudi Arabia&apos;s</span> side if 
            their key allies do the same. This WW3 map mode shows how local disputes could grow into World War 3 
            as countries honor their alliance commitments. Nations you mark as{" "}
            <span className="text-gray-800 font-medium">Neutral</span> won&apos;t be factored into these 
            World War 3 alliance calculations.
          </p>
          </div>
        </section>
      </article>
    );
  };