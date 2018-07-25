module.exports = async function sort (array, comparator) {
  var N = array.length
  if (N < 2) {
    return array
  }
  var other = Array(N)

  // alternative: var strideLen = N/2 / Math.abs(1 << (Math.ceil(Math.log2(N)) - 1));
  var strideLen = N
  while (strideLen > 1) {
    strideLen /= 2
  }

  // alternative: first strideLen *= 2 and do a pre-pass for size-2 strides only
  do {
    var stride = strideLen
    var read1 = 0
    do {
      var startRead2 = Math.ceil(stride)
      var read2 = startRead2
      var mergeEnd = Math.ceil(stride + strideLen)
      stride += 2 * strideLen
      var write = read1
      while (read1 < startRead2 && read2 < mergeEnd) {
        other[write++] = array[(await comparator(array[read1], array[read2])) <= 0 ? read1++ : read2++]
      }
      while (read1 < startRead2) {
        other[write++] = array[read1++]
      }
      while (read2 < mergeEnd) {
        other[write++] = array[read2++]
      }
      read1 = mergeEnd
    } while (stride < N)

    var temp = array
    array = other
    other = temp
    strideLen *= 2
  } while (strideLen < N)

  return array
}
