//this mergesort is similar to https://github.com/calvinmetcalf/grin
//for now, this relies on its caller using co-callback

var merge = function*(comparator, start1, end, in_array, out_array){
    var start2 = Math.floor((start1 + end)/2);//midpoint defining subarrays
    var head1 = start1;
    var head2 = start2;
    var out = start1;
    while(head1 < start2 && head2 < end){
        out_array[out++] = in_array[
            ((yield comparator(in_array[head1], in_array[head2])) <= 0)
                ? head1++
                : head2++
        ];
    }
    while(head1 < start2){
        out_array[out++] = in_array[head1++];
    }
    while(head2 < end){
        out_array[out++] = in_array[head2++];
    }
};

module.exports = function*(array, comparator){
    var len = array.length;
    var other = Array(len);
    for(var stride=2; stride < len*2; stride*=2){
        var start = 0;
        var end = stride;
        while(start < len){
            yield merge(comparator, start, Math.min(end, len), array, other);
            start = end;
            end += stride;
        }
        var temp = array;
        array = other;
        other = temp;
    }
    return array;
};