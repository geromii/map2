import * as math from "mathjs";
import { useStore } from "./store";

const storeState = useStore.getState()


function transformStateToNumericArray(stateWrapper) {
  const stateArray = new Array(200).fill(0); // Assuming the array length is always 200

  Object.keys(stateWrapper).forEach((country, index) => {
    const countryState = stateWrapper[country].phase;

    switch (countryState) {
      case 0:
        stateArray[index] = 0;
        break;
      case 1:
        stateArray[index] = 0.6;
        break;
      case 2:
        stateArray[index] = -0.6;
        break;
      case 3:
        stateArray[index] = 0;
        break;
      default:
        stateArray[index] = 0; // Default case, you can adjust it as per your needs
    }
  });

  return stateArray;
}

async function fetchScoresMatrix() {
  let scoresMatrix = localStorage.getItem("scoresMatrix");
  if (!scoresMatrix) {
    const response = await fetch("/scores_matrix.json");
    scoresMatrix = await response.json();
    localStorage.setItem("scoresMatrix", JSON.stringify(scoresMatrix));
  } else {
    scoresMatrix = JSON.parse(scoresMatrix);
  }
  return scoresMatrix;
}

export async function multiplyWithScoresMatrix(
  stateWrapper
) {

  const isProjectionActive = storeState.isProjectionActive;
  const isSecondOrderActive = storeState.isSecondOrderActive;

  if (!isProjectionActive) return new Array(200).fill(0); // If projections are off, return an array of zeros
  let case1Exists = false;
  let case2Exists = false;

  // Checking if at least one country is in case 1 and one in case 2
  Object.values(stateWrapper).forEach((countryStateWrapper) => {
    if (countryStateWrapper.phase === 1) case1Exists = true;
    if (countryStateWrapper.phase === 2) case2Exists = true;
  });

  console.log(case1Exists, case2Exists);
  // Return an array of zeros if the required condition is not met
  if (!case1Exists || !case2Exists) return new Array(200).fill(0);

  const scoresMatrix = await fetchScoresMatrix();
  const stateArray = transformStateToNumericArray(stateWrapper);
  let result = math.multiply(scoresMatrix, stateArray);

  // Reset case 3 countries in the result to zero
  Object.keys(stateWrapper).forEach((country, index) => {
    if (stateWrapper[country].phase === 3) {
      result[index] = 0;
    }
  });

  if (isSecondOrderActive) {
    const modifiedScoresMatrix = math.map(
      scoresMatrix,
      (value) =>
        Math.abs(value) *
        Math.abs(value) *
        Math.abs(value) *
        Math.abs(value) *
        4 *
        value,
    );
    const secondOrderResult = math.multiply(modifiedScoresMatrix, result);
    result = math.divide(math.add(result, secondOrderResult), 2); // Averaging the result with the second order result
  }

  console.log("Result", result);
  return result;
}
