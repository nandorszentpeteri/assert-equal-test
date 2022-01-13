//jshint esnext:true

/**
 * Basics implemented with the path using a global variable
 * It's checking object equality not deep equality
 * 
 * MISSING
 * ???
 * 
 * IMPLEMENTED
 * Custom error message containing only data and generating messages considering other factors too
 * Handles Dates
 * Handles nested arrays
 * It can find a missing/extra attributes in objects
 * 
*/

// Global error variable
let assertEqualPath = [];

// Custom exception to handle assert equal errors
class AssertEqualException {
  /**
   * Constructor
   * @param {String} type 
   * @param {*} expected 
   * @param {*} actual 
   * @param {Boolean} reverse 
   */
  constructor(type, expected, actual, reverse = false) {
    this.type = type;
    this.expected = expected;
    this.actual = actual;
    this.reverse = reverse;
  }
}

/**
 * Checking the type equality between two values.
 * Failing it throws an error if a difference is found.
 * Used resource: https://levelup.gitconnected.com/how-to-check-for-an-object-in-javascript-object-null-check-3b2632330296
 * 
 * @param {*} a
 * @param {*} b
 * @returns {string}
 */
function typeCheck(a, b) {
  const typeRegex = /^\[object (\w+)]/;

  const aType = Object.prototype.toString.call(a).match(typeRegex)[1];
  const bType = Object.prototype.toString.call(b).match(typeRegex)[1];

  if (aType === bType) {
    return aType;
  } else {
    throw new AssertEqualException("Type", aType, bType);
  }
}

/**
 * Checking the equality of two arrays
 * 
 * @param {Array} a 
 * @param {Array} b 
 * @param {Number} level
 */
function arrayEquality(a, b, level) {
  if (a.length === b.length) {
    a.forEach((aElement, i) => {
      assertEqualPath.push({ level, type: "Array", value: i });
      checkEquality(aElement, b[i], level + 1, i)
    });
  } else {
    throw new AssertEqualException("Array", a.length, b.length);
  }
}

/**
 * Checking the equality of two objects
 * 
 * @param {object} a 
 * @param {object} b 
 * @param {Number} level
 * @param {Boolean} reverse
 */
function objectEquality(a, b, level, reverse) {
  Object.keys(a).forEach((aKey) => {
    assertEqualPath.push({ level, type: "Object", value: aKey });
    if (aKey && Object.keys(b).includes(aKey)) {
      checkEquality(a[aKey], b[aKey], level + 1)
    } else {
      throw new AssertEqualException("Object", null, null, reverse);
    }
  });
}

/**
 * Checking the equality of two values
 * 
 * @param {*} expected 
 * @param {*} actual 
 */
function checkEquality(expected, actual, level = 0) {
  const type = typeCheck(expected, actual);

  switch (type) {
    case "Array":
      arrayEquality(expected, actual, level);
      break;
    case "Object":
      if (Object.keys(expected).length >= Object.keys(actual).length) {
        objectEquality(expected, actual, level, false)
      } else {
        objectEquality(actual, expected, level, true)
      }
      break;
    default:
      if (expected !== actual) {
        throw new AssertEqualException(type, expected, actual);
      }
  }
}

/**
 * Determines the path to the error in the graph
 * 
 * @param {Array<String>} path 
 * @returns {String}
 */
function determineErrorPath(path) {
  // Select the correct error path, only going up in the graph
  const selectedPath = path.reduceRight((arr, current) => {
    if (!arr.find((e) => e.level <= current.level)) {
      arr.push(current);
    };
    return arr;
  }, [])

  // Build a readable version of the error path
  const concatenatedPath = selectedPath.reduceRight((path, current) => {
    if (current.type === "Array") {
      path = path.slice(0, path.length - 1) + `[${current.value}].`;
    } else {
      path += `${current.value}.`;
    }

    return path;
  }, "")

  // The path builder will always put a concatenation "." at the end, which we remove here
  return concatenatedPath.slice(0, concatenatedPath.length - 1);
}

/**
 * Builds the error message based on the assertionError and errorPath variables
 * 
 * @param {AssertEqualException} assertionError 
 * @param {String} errorPath 
 * @returns {String}
 */
function createErrorMessage(assertionError, errorPath = null) {
  const { type, expected, actual, reverse } = assertionError;

  switch (type) {
    case "Array":
      return errorPath
        ? `Expected ${errorPath} array length ${expected} but found ${actual}`
        : `Expected array length ${expected} but found ${actual}`
    case "Object":
      return reverse
        ? `Found ${errorPath} but was not expected`
        : `Expected ${errorPath} but was not found`;
    case "String":
      return errorPath
        ? `Expected ${errorPath} "${expected}" but found "${actual}"`
        : `Expected "${expected}" found "${actual}"`;
    case "Type":
      return errorPath
        ? `Expected ${errorPath} type ${expected} but found type ${actual}`
        : `Expected type ${expected} but found type ${actual}`;;
    case "Date":
      return errorPath
        ? `Expected ${errorPath} date ${expected.toLocaleDateString()} but found ${actual.toLocaleDateString()}`
        : `Expected date ${expected.toLocaleDateString()} but found ${actual.toLocaleDateString()}`;;
    default:
      return errorPath
        ? `Expected ${errorPath} ${expected} but found ${actual}`
        : `Expected ${expected} but found ${actual}`
  }
}

/**
 * Asserts "expected" versus "actual", 
 * 'failing' the assertion (via thrwoing an Error) if a difference is found.
 *
 * @param {String} message The comparison message passed by the user
 * @param {*} expected The expected item
 * @param {*} actual The actual item
 */
function assertEquals(message, expected, actual) {
  // Always reset the path before we try to execute the next test case
  assertEqualPath = [];
  try {
    checkEquality(expected, actual);
  } catch (error) {
    const errorPath = assertEqualPath ? determineErrorPath(assertEqualPath) : null;
    throw new Error(`${message}: ${createErrorMessage(error, errorPath)}`)
  }
}

/* -- Test running code:  --- */

/**
 * Runs a "assertEquals" test.
 * 
 * @param {String} message The initial message to pass
 * @param {*} expected Expected item
 * @param {*} actual The actual item
 */
function runTest({ message, expected, actual }) {
  try {
    assertEquals(message, expected, actual);
  } catch (error) {
    return error.message;
  }
}

function runAll() {
  var complexObject1 = {
    propA: 1,
    propB: {
      propA: [1, { propA: 'a', propB: 'b' }, 3],
      propB: 1,
      propC: 2
    }
  };
  var complexObject1Copy = {
    propA: 1,
    propB: {
      propA: [1, { propA: 'a', propB: 'b' }, 3],
      propB: 1,
      propC: 2
    }
  };
  var complexObject2 = {
    propA: 1,
    propB: {
      propB: 1,
      propA: [1, { propA: 'a', propB: 'c' }, 3],
      propC: 2
    }
  };
  var complexObject3 = {
    propA: 1,
    propB: {
      propA: [1, { propA: 'a', propB: 'b' }, 3],
      propB: 1
    }
  };
  var customObject1 = {
    propA: 1,
    propB: {
      propA: [1, [{ propA: 'a', propB: 'b' }, "nested"], 3],
      propB: 1,
    }
  }
  var customObject2 = {
    propA: 1,
    propB: {
      propA: [1, [{ propA: 'a', propB: 'c' }, "nested"], 3],
      propB: 1,
    }
  }
  var customObject3 = {
    propA: 1,
    propB: {
      propA: [1, [{ propA: 'a', propB: ["a", "b"] }, "nested"], 3],
      propB: 1,
    }
  }
  var customObject4 = {
    propA: 1,
    propB: {
      propA: [1, [{ propA: 'a', propB: ["a", "b", "c"] }, "nested"], 3],
      propB: 1,
    }
  }
  var customObject5 = {
    propA: 1,
    propB: {
      propA: [1, [{ propA: 'a', propB: ["a", "b", { propA: 1 }] }, "nested"], 3],
      propB: 1,
    }
  }
  var customDate1 = new Date(2020, 01, 01);
  var customDate2 = new Date(2021, 02, 01);
  class CustomClass {
    constructor(a, b) {
      this.attrA = a;
      this.attrB = b;
    }
  }

  var testCases = [
    { message: 'Test 01', expected: 'abc', actual: 'abc' },
    { message: 'Test 02', expected: 'abcdef', actual: 'abc' },
    { message: 'Test 03', expected: ['a'], actual: { 0: 'a' } },
    { message: 'Test 04', expected: ['a', 'b'], actual: ['a', 'b', 'c'] },
    { message: 'Test 05', expected: ['a', 'b', 'c'], actual: ['a', 'b', 'c'] },
    { message: 'Test 06', expected: complexObject1, actual: complexObject1Copy },
    { message: 'Test 07', expected: complexObject1, actual: complexObject2 },
    { message: 'Test 08', expected: complexObject1, actual: complexObject3 },
    { message: 'Test 09', expected: null, actual: {} },
    { message: 'Test 10', expected: customObject1, actual: customObject2 },
    { message: 'Test 11', expected: customObject3, actual: customObject4 },
    { message: 'Test 12', expected: customObject4, actual: customObject5 },
    { message: 'Test 13', expected: customDate1, actual: customDate2 },
    { message: 'Test 14', expected: complexObject3, actual: complexObject1 },
    { message: 'Test 15', expected: 12, actual: 23 },
    { message: 'Test 16', expected: false, actual: true },
    { message: 'Test 17', expected: undefined, actual: undefined },
    { message: 'Test 18', expected: 54740992n, actual: 90071992n },
    { message: 'Test 19', expected: Number(10), actual: BigInt(10) },
    { message: 'Test 20', expected: NaN, actual: Infinity },
    { message: 'Test 21', expected: CustomClass, actual: CustomClass },
    { message: 'Test 22', expected: new CustomClass("test"), actual: new CustomClass("test") },
    { message: 'Test 23', expected: CustomClass, actual: Error },
    { message: 'Test 24', expected: new CustomClass("a"), actual: new CustomClass("b") },
    { message: 'Test 25', expected: [complexObject1], actual: [complexObject2] },
  ];

  assertionFailures = testCases.map(runTest)
    .filter(result => result !== undefined)
    .forEach(addToList)
}

function addToList(message) {
  var messagesEl = document.getElementById('messages');
  var newListEl = document.createElement('li');
  newListEl.innerHTML = message;
  messagesEl.appendChild(newListEl);
}

runAll();
