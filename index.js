/** 
 * Find out operation temperatures in flash vaporization camera
*/

const operationPressure = 2 * 760 // mmHg
const feedComposition = [
  {
    i: 1,
    isMostVolatile: false,
    fraction: 0.06,
    a: 6.85802,
    b: 819.296,
    c: 248.733
  },
  {
    i: 2,
    isMostVolatile: false,
    fraction: 0.63,
    a: 7.01493,
    b: 1316.554,
    c: 237.569
  },
  {
    i: 3,
    isMostVolatile: true,
    fraction: 0.31,
    a: 6.83410,
    b: 1276.415,
    c: 221.949
  }
]

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

console.log("Boiling temperature (Tmin) => ", boilingTemperature(feedComposition, operationPressure))
console.log("Dew temperature (Tmax) => ", dewTemperature(feedComposition, operationPressure))

function dewTemperature(feed, operationPressure) {
  const temperatures = []

  for (var temperature = 0; temperature < 200; temperature = temperature + 0.1) {
    const steamPressures = antoineEquationKnowingTemperature(feed, temperature)

    // verify sum(P * xi) / Pi => boiling temperature
    const sum = +(steamPressures.reduce((accumulator, compound) => {
      return +accumulator + operationPressure * compound.fraction / compound.steamPressure
    }, 0)).toFixed(3)

    // console.log(sum)
    if (+sum < 1.005 && sum > 0.995) {
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

  for (var temperature = 0; temperature < 200; temperature = temperature + 0.1) {
    const steamPressures = antoineEquationKnowingTemperature(feed, temperature)

    // verify sum(Pi * xi) / P => operation temperature
    const sum = +(steamPressures.reduce((accumulator, compound) => {
      return +accumulator + +(compound.steamPressure * compound.fraction)
    }, 0) / operationPressure).toFixed(3)

    // console.log(sum)
    if (+sum < 1.005 && sum > 0.995) {
      temperatures.push({
        temperature: temperature,
        sum: sum
      })
    }
  }
  return temperatures
}