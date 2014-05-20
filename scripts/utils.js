var group = function(array, numberOfGroups) {
  var results = [];
  for (var i = 0; i < numberOfGroups; i++) {
    results.push([]);
  }

  for (i = 0; i < array.length; i++) {
    if (array[i] === undefined) {
      console.info ("****");
    }
    results[i % numberOfGroups].push(array[i]);
  }
  return results;
};

exports.group = group;