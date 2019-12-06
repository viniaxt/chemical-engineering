/** 
 * Find out operation temperatures in flash vaporization camera
*/

// questão resolvida aula teórica
// const feedComposition = [
//   {
//     i: 1,
//     isMostVolatile: false,
//     fraction: 0.06,
//     a: 6.85802,
//     b: 819.296,
//     c: 248.733
//   },
//   {
//     i: 2,
//     isMostVolatile: false,
//     fraction: 0.63,
//     a: 7.01493,
//     b: 1316.554,
//     c: 237.569
//   },
//   {
//     i: 3,
//     isMostVolatile: true,
//     fraction: 0.31,
//     a: 6.83410,
//     b: 1276.415,
//     c: 221.949
//   }
// ]

// questão 14
const feedComposition = [
  {
    i: 1,
    isMostVolatile: false,
    fraction: 0.3,
    a: 6.83029,
    b: 945.90,
    c: 240.000
  },
  {
    i: 2,
    isMostVolatile: false,
    fraction: 0.4,
    a: 6.85221,
    b: 1064.63,
    c: 232.000
  },
  {
    i: 3,
    isMostVolatile: true,
    fraction: 0.30,
    a: 6.87776,
    b: 1171.53,
    c: 222.366
  }
]
const operationPressure = 7 * 760// mmHg
const operationTemperature = 106 // ºC

// questão 12
// const feedComposition = [
//   {
//     i: 1,
//     isMostVolatile: false,
//     fraction: 0.70,
//     a: 6.85146,
//     b: 1206.470,
//     c: 223.130
//   },
//   {
//     i: 2,
//     isMostVolatile: false,
//     fraction: 0.30,
//     a: 6.95087,
//     b: 1342.310,
//     c: 219.120
//   }
// ]
// const operationPressure = 1 * 760// mmHg
// const operationTemperature = 89 // ºC

console.time("Performance")
console.log(`Dew temperature for ${operationPressure}mmHg (Tmax) => `, dewTemperature(feedComposition, operationPressure))
console.log(`Boiling temperature for ${operationPressure}mmHg (Tmin) => `, boilingTemperature(feedComposition, operationPressure))
console.log(`Flow rate knowing temperature ${operationTemperature}ºC and feedFlowRate = 100 => `, flowRateDeterminationKnowingTemperature(feedComposition, operationTemperature))
console.timeEnd("Performance")

function calculateFlashConstant(compoundsWithSteamPressures, operationPressure) {
  return compoundsWithSteamPressures.reduce((compoundsWithConstants, actualCompound) => {
    return [
      ...compoundsWithConstants,
      {
        ...actualCompound,
        flashConstant: actualCompound.steamPressure / operationPressure
      }
    ]
  }, [])
}

function flowRateDeterminationKnowingTemperature(feed, temperature) {
  var phiValue = 0
  const compoundsWithSteamPressures = antoineEquationKnowingTemperature(feed, temperature)
  const compoundsWithFlashConstants = calculateFlashConstant(compoundsWithSteamPressures, operationPressure)
  for (let phi = 0; phi < 1; phi = phi + 0.00001) {

    const sum = compoundsWithFlashConstants.reduce((accumulator, { fraction, flashConstant }) => {
      return +accumulator + +((fraction * (flashConstant - 1)) / (1 + (phi * (flashConstant - 1))))
    }, 0).toFixed(4)

    if (sum >= -0.00005 && sum <= 0.00005) {
      phiValue = phi.toFixed(3)
    }
  }

  const flowValues = {
    feedFlowRate: 100,
    vaporizedFlowRate: 100 * phiValue,
    liquidFlowRate: 100 * (1 - phiValue)
  }

  const compositions = compoundsWithFlashConstants.reduce((accumulator, { fraction, flashConstant, i }) => {
    const xi = (fraction * flowValues.feedFlowRate) / (flowValues.liquidFlowRate + flowValues.vaporizedFlowRate * flashConstant)
    return {
      ...accumulator,
      "xi": {
        ...accumulator.xi,
        [`x${i}`]: xi
      },
      "yi": {
        ...accumulator.yi,
        [`y${i}`]: flashConstant * xi
      }
    }
  }, {})

  return {
    phi: phiValue,
    feedFlowRate: flowValues.feedFlowRate,
    vaporizedFlowRate: flowValues.vaporizedFlowRate,
    liquidFlowRate: flowValues.liquidFlowRate,
    compositions
  }
}

function antoineEquationKnowingTemperature(feed, temperature) {
  return feed.reduce((steamPressures, actual) => {
    const power = actual.a - (actual.b / (actual.c + temperature))
    const newSteamPressure = Math.pow(10, power)
    return [
      ...steamPressures,
      {
        ...actual,
        steamPressure: newSteamPressure
      }
    ]
  }, [])
}

function dewTemperature(feed, operationPressure) {
  const temperatures = []

  for (var temperature = 0; temperature < 400; temperature = temperature + 0.01) {
    const steamPressures = antoineEquationKnowingTemperature(feed, temperature)

    const sum = +(steamPressures.reduce((accumulator, compound) => {
      return +accumulator + operationPressure * compound.fraction / compound.steamPressure
    }, 0)).toFixed(3)

    if (+sum < 1.0005 && sum > 0.9995) {
      temperatures.push({
        temperature: temperature,
        sum: sum
      })
    }
  }
  return temperatures
}

function boilingTemperature(feed, operationPressure) {
  const temperatures = []

  for (var temperature = 0; temperature < 400; temperature = temperature + 0.01) {
    const steamPressures = antoineEquationKnowingTemperature(feed, temperature)

    const sum = +(steamPressures.reduce((accumulator, compound) => {
      return +accumulator + +(compound.steamPressure * compound.fraction)
    }, 0) / operationPressure).toFixed(3)

    if (+sum < 1.0005 && sum > 0.9995) {
      temperatures.push({
        temperature: temperature,
        sum: sum
      })
    }
  }
  return temperatures
}