const insertionSort = require('./insertion-sort');

describe('insertion sort', () => {
    it('should sort an array', async () => {
        expect(insertionSort(['c', 'b', 'a'])).toEqual(['a', 'b', 'c']);
    });

    it('should sort an array that is already sorted', async () => {
        expect(insertionSort(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should sort an array with only one value', async () => {
        expect(insertionSort(['a'])).toEqual(['a']);
    });

    it('should sort an empty array', async () => {
        expect(insertionSort([])).toEqual([]);
    });

    it('should not sort a null array', async () => {
        expect(() => insertionSort(null)).toThrow('Cannot read property \'length\' of null');
    });
});
