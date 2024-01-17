import * as math from 'mathjs';

function transformStateToNumericArray(state) {
    const stateArray = new Array(200).fill(0); // Assuming the array length is always 200

    Object.keys(state).forEach((country, index) => {
        const countryState = state[country].state;
        
        switch (countryState) {
            case 0: 
                stateArray[index] = 0;
                break;
            case 1: 
                stateArray[index] = 0.5;
                break;
            case 2: 
                stateArray[index] = -0.5;
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
    let scoresMatrix = localStorage.getItem('scoresMatrix');
    if (!scoresMatrix) {
        const response = await fetch('/scores_matrix.json');
        scoresMatrix = await response.json();
        localStorage.setItem('scoresMatrix', JSON.stringify(scoresMatrix));
    } else {
        scoresMatrix = JSON.parse(scoresMatrix);
    }
    return scoresMatrix;
}


export async function multiplyWithScoresMatrix(state, isProjectionActive, isSecondOrderActive) {
    if (!isProjectionActive) return new Array(200).fill(0); // If projections are off, return an array of zeros
  
    const scoresMatrix = await fetchScoresMatrix();
    const stateArray = transformStateToNumericArray(state);
    let result = math.multiply(scoresMatrix, stateArray);
  
    if (isSecondOrderActive) {
        const modifiedScoresMatrix = math.map(scoresMatrix, value => Math.abs(value) * Math.abs(value) * value);
        const secondOrderResult = math.multiply(modifiedScoresMatrix, result);
        result = math.divide(math.add(result, secondOrderResult), 2); // Averaging the result with the second order result
    }
  
    return result;
}

