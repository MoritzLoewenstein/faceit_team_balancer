module.exports = (arr, len) => {
  function fn (combinationLen, srcArr, combinationArr, combinations) {
    if (combinationLen === 0) {
      if (combinationArr.length > 0) {
        combinations[combinations.length] = combinationArr
      }
      return
    }
    for (let j = 0; j < srcArr.length; j++) {
      fn(combinationLen - 1, srcArr.slice(j + 1), combinationArr.concat([srcArr[j]]), combinations)
    }
  }
  const all = []
  fn(len, arr, [], all)
  return all
};
