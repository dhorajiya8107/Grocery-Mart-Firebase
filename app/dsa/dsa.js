// function printDiamondInStarSquare(n) {
//     if (n < 5 || n % 2 === 0) {
//         console.log("Please provide an odd number ≥ 5");
//         return;
//     }

//     const mid = Math.floor(n / 2);

//     for (let i = 0; i < n; i++) {
//         let row = '';
//         for (let j = 0; j < n; j++) {
//             if (
//                 i === 0 || i === n - 1 ||
//                 j === 0 || j === n - 1
//             ) {
//                 row += '1';
//             } else {
//                 const dist = Math.abs(mid - i);
//                 if (j >= dist && j < n - dist) {
//                     row += ' ';
//                 } else {
//                     row += '*';
//                 }
//             }
//         }
//         console.log(row);
//     }
// }

// printDiamondInStarSquare(9);

// function isArmstrongNumber(num) {
//     const digits = num.toString().split('');
//     const power = digits.length;
//     let sum = 0;

//     for (let digit of digits) {
//         sum += Math.pow(Number(digit), power);
//     }

//     return sum === num;
// }

// const number = 153;

// if (isArmstrongNumber(number)) {
//     console.log(`${number} is an Armstrong number.`);
// } else {
//     console.log(`${number} is NOT an Armstrong number.`);
// }

