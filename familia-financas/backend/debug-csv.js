const line = "24-11-2025,24-11-2025,Lidl Montijo,-67.77";

// Regex para CSV: Data,Data,Descrição,Valor
const csvRegex = /(\d{2}-\d{2}-\d{4}),(\d{2}-\d{2}-\d{4}),(.+?),([\+\-]?\d+(?:\.\d+)?)/;

const match = line.match(csvRegex);
console.log('Match:', match);

if (match) {
    console.log('Data:', match[1]);
    console.log('Descrição:', match[3]);
    console.log('Valor:', match[4]);
}

