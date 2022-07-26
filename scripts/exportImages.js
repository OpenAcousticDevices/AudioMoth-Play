/****************************************************************************
 * exportImages.js
 * openacousticdevices.info
 * May 2022
 *****************************************************************************/

/* global jsPDF */

window.jsPDF = window.jspdf.jsPDF;

const w = 824;
const h = Math.ceil(w / 4 * 3);

/**
 * Save both visible plots as "fileName.pdf"
 * @param {canvas[]} canvas0array Ordered array of canvas layers for top plot
 * @param {canvas[]} canvas1array Ordered array of canvas layers for bottom plot
 * @param {canvas} xAxisSVG SVG canvas containing x axis labels
 * @param {canvas} yAxis0SVG SVG canvas containing y axis labels of top plot
 * @param {canvas} yAxis1SVG SVG canvas containing y axis labels of bottom plot
 * @param {string} yAxisTitle0 Title of top plot's y axis
 * @param {string} yAxisTitle1 Title of bottom plot's y axis
 * @param {int[]} linesY0 Y co-ordinates of threshold lines on plot 0 (-1 = don't draw)
 * @param {int[]} linesY1 Y co-ordinates of threshold lines on plot 1 (-1 = don't draw)
 * @param {string} fileName Name of file being drawn
 * @param {string} title Title to be drawn at the top of the file(s)
 */
function exportPDF (canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title) {

    console.log('Exporting to PDF');

    // Calculate size of overall canvas

    const xAxisLabelH = 10;
    const yAxisLabelW = 15;
    const xAxisMarkerH = 25;
    const yAxisMarkerW = 40;

    const edgeSpacingW = 8;
    const edgeSpacingH = 15;

    const topSpacing = 30 + edgeSpacingH;

    const xAxisH = xAxisMarkerH + xAxisLabelH;
    const yAxisW = yAxisMarkerW + yAxisLabelW + edgeSpacingW;

    const canvas0 = canvas0array[0];
    const canvas1 = canvas1array[0];

    const plotSpacing = h - (topSpacing + canvas0.height + canvas1.height + xAxisH + edgeSpacingH);

    // Create document

    const pdfDoc = new jsPDF({
        orientation: 'landscape',
        hotfixes: ['px_scaling'],
        unit: 'px',
        format: [w, h]
    });

    pdfDoc.setFont('FreeSans', 'normal');

    // Draw plots to canvas

    for (let i = 0; i < canvas0array.length; i++) {

        pdfDoc.addImage(canvas0array[i], 'PNG', yAxisW, topSpacing);

    }

    for (let i = 0; i < canvas1array.length; i++) {

        pdfDoc.addImage(canvas1array[i], 'PNG', yAxisW, topSpacing + canvas0.height + plotSpacing);

    }

    // Give plots a border

    pdfDoc.setDrawColor('#000000');

    pdfDoc.rect(yAxisW, topSpacing, canvas0.width, canvas0.height);
    pdfDoc.rect(yAxisW, topSpacing + canvas0.height + plotSpacing, canvas1.width, canvas1.height);

    // Add x axis labels

    pdfDoc.setDrawColor('#000000');

    const xLines = xAxisSVG.getElementsByTagName('line');
    const xLabels = xAxisSVG.getElementsByTagName('text');

    const xOffset = 45;
    const yOffset0 = topSpacing + canvas0.height;
    const yOffset1 = topSpacing + canvas0.height + plotSpacing + canvas1.height;

    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor('#000000');

    for (let i = 0; i < xLines.length; i++) {

        let x = parseFloat(xLines[i].getAttribute('x1')) + yAxisW - xOffset;
        const labelText = xLabels[i].innerHTML;

        x = (i === 0) ? x - 1 : x;
        x = (i === xLines.length - 1) ? x + 0.5 : x;

        pdfDoc.line(x, yOffset0, x, yOffset0 + 5);
        pdfDoc.line(x, yOffset1, x, yOffset1 + 5);
        pdfDoc.text(labelText, x, yOffset1 + 15, {align: 'center'});

    }

    // Add canvas 0 y axis labels

    const y0Lines = yAxis0SVG.getElementsByTagName('line');
    const y0Labels = yAxis0SVG.getElementsByTagName('text');

    for (let i = 0; i < y0Lines.length; i++) {

        let y = parseFloat(y0Lines[i].getAttribute('y1'));
        const labelText = y0Labels[i].innerHTML;

        y += topSpacing;

        y = (i === y0Lines.length - 1) ? y - 0.5 : y;
        y = (i === 0) ? y + 0.5 : y;

        pdfDoc.line(yAxisW, y, yAxisW - 5, y);

        pdfDoc.text(labelText, yAxisW - 7, y, {align: 'right', baseline: 'middle'});

    }

    // Add canvas 1 y axis labels

    const y1Lines = yAxis1SVG.getElementsByTagName('line');
    const y1Labels = yAxis1SVG.getElementsByTagName('text');

    for (let i = 0; i < y1Lines.length; i++) {

        let y = parseFloat(y1Lines[i].getAttribute('y1'));
        y += topSpacing + canvas0.height + plotSpacing;

        const labelText = y1Labels[i].innerHTML;

        y = (i === 0) ? y + 0.5 : y;
        y = (i === y1Lines.length - 1) ? y - 0.5 : y;

        pdfDoc.line(yAxisW, y, yAxisW - 5, y);

        pdfDoc.text(labelText, yAxisW - 7, y, {align: 'right', baseline: 'middle'});

    }

    // Draw threshold lines

    pdfDoc.setDrawColor('#000000');

    const lineXstart = yAxisW;
    const lineXend = yAxisW + canvas0.width;

    for (let i = 0; i < linesY0.length; i++) {

        if (linesY0[i] !== -1) {

            const lineY = linesY0[i] + topSpacing;

            pdfDoc.line(lineXstart, lineY, lineXend, lineY);

        }

    }

    for (let i = 0; i < linesY1.length; i++) {

        if (linesY1[i] !== -1) {

            const lineY = linesY1[i] + topSpacing + canvas0.height + plotSpacing;

            pdfDoc.line(lineXstart, lineY, lineXend, lineY);

        }

    }

    // Add titles

    pdfDoc.text('Time (secs)', yAxisW + (canvas0.width / 2), topSpacing + canvas0.height + plotSpacing + canvas1.height + xAxisMarkerH, {align: 'center', baseline: 'top'});

    // jsPDF breaks if you try to centre align rotated text, so you have to hard code an offset
    const textOffsetY = (yAxisTitle0 === 'Amplitude') ? 20 : 50;

    pdfDoc.text(yAxisTitle0, edgeSpacingW + 5, topSpacing + (canvas0.height / 2) + textOffsetY, null, 90);

    pdfDoc.text(yAxisTitle1, edgeSpacingW + 5, topSpacing + canvas0.height + plotSpacing + (canvas1.height / 2) + 25, null, 90);

    pdfDoc.setFontSize(11);
    pdfDoc.text(title, yAxisW + (canvas0.width / 2), edgeSpacingH + 2, {align: 'center', baseline: 'top'});

    pdfDoc.save(fileName + '_EXPORT.pdf');

}

/**
 * Create a canvas object which can be saved
 * @param {canvas[]} canvas0array Ordered array of canvas layers for top plot
 * @param {canvas[]} canvas1array Ordered array of canvas layers for bottom plot
 * @param {canvas} xAxisSVG SVG canvas containing x axis labels
 * @param {canvas} yAxis0SVG SVG canvas containing y axis labels of top plot
 * @param {canvas} yAxis1SVG SVG canvas containing y axis labels of bottom plot
 * @param {string} yAxisTitle0 Title of top plot's y axis
 * @param {string} yAxisTitle1 Title of bottom plot's y axis
 * @param {int[]} linesY0 Y co-ordinates of threshold lines on plot 0 (-1 = don't draw)
 * @param {int[]} linesY1 Y co-ordinates of threshold lines on plot 1 (-1 = don't draw)
 * @param {string} fileName Name of file being drawn
 * @param {string} title Title to be drawn at the top of the file(s)
 */
function createImageCanvas (canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title) {

    // Calculate size of overall canvas

    const xAxisLabelH = 10;
    const yAxisLabelW = 15;
    const xAxisMarkerH = 25;
    const yAxisMarkerW = 40;

    const edgeSpacingW = 8;
    const edgeSpacingH = 15;

    const topSpacing = 30 + edgeSpacingH;

    const xAxisH = xAxisMarkerH + xAxisLabelH;
    const yAxisW = yAxisMarkerW + yAxisLabelW + edgeSpacingW;

    const canvas0 = canvas0array[0];
    const canvas1 = canvas1array[0];

    const plotSpacing = h - (topSpacing + canvas0.height + canvas1.height + xAxisH + edgeSpacingH);

    // Create canvas

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');

    // Fill background

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, w, h);

    // Draw plots to canvas

    for (let i = 0; i < canvas0array.length; i++) {

        ctx.drawImage(canvas0array[i], yAxisW, topSpacing);

    }

    for (let i = 0; i < canvas1array.length; i++) {

        ctx.drawImage(canvas1array[i], yAxisW, topSpacing + canvas0.height + plotSpacing);

    }

    // Give plots a border

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    ctx.rect(yAxisW + 0.5, topSpacing + 0.5, canvas0.width - 1, canvas0.height - 1);

    ctx.rect(yAxisW + 0.5, topSpacing + canvas0.height + plotSpacing + 0.5, canvas1.width - 1, canvas1.height - 1);
    ctx.stroke();

    // Add x axis labels

    ctx.strokeStyle = 'black';

    const xLines = xAxisSVG.getElementsByTagName('line');
    const xLabels = xAxisSVG.getElementsByTagName('text');

    // Y axis labels give an offset to the plots on the site
    const xOffset = 45;

    const yOffset0 = topSpacing + canvas0.height;
    const yOffset1 = topSpacing + canvas0.height + plotSpacing + canvas1.height;

    ctx.font = '11px Helvetica';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';

    for (let i = 0; i < xLines.length; i++) {

        let x = parseFloat(xLines[i].getAttribute('x1')) + yAxisW - xOffset;
        x = x - (x % 1) + 0.5;
        x = (i === 0) ? x - 1 : x;

        const labelText = xLabels[i].innerHTML;

        ctx.beginPath();
        ctx.moveTo(x, yOffset0);
        ctx.lineTo(x, yOffset0 + 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, yOffset1);
        ctx.lineTo(x, yOffset1 + 5);
        ctx.stroke();
        ctx.fillText(labelText, x, yOffset1 + 15);

    }

    // Add canvas 0 y axis labels

    ctx.strokeStyle = 'black';

    const y0Lines = yAxis0SVG.getElementsByTagName('line');
    const y0Labels = yAxis0SVG.getElementsByTagName('text');

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < y0Lines.length; i++) {

        let y = parseFloat(y0Lines[i].getAttribute('y1'));
        y = y - (y % 1) + 0.5;
        y += topSpacing;

        const labelText = y0Labels[i].innerHTML;

        ctx.beginPath();
        ctx.moveTo(yAxisW, y);
        ctx.lineTo(yAxisW - 5, y);
        ctx.stroke();

        ctx.fillText(labelText, yAxisW - 7, y);

    }

    // Add canvas 1 y axis labels

    const y1Lines = yAxis1SVG.getElementsByTagName('line');
    const y1Labels = yAxis1SVG.getElementsByTagName('text');

    ctx.textBaseline = 'middle';

    for (let i = 0; i < y1Lines.length; i++) {

        let y = parseFloat(y1Lines[i].getAttribute('y1'));
        y = y - (y % 1) + 0.5;
        y += topSpacing + canvas0.height + plotSpacing;

        const labelText = y1Labels[i].innerHTML;

        ctx.beginPath();
        ctx.moveTo(yAxisW, y);
        ctx.lineTo(yAxisW - 5, y);
        ctx.stroke();

        ctx.fillText(labelText, yAxisW - 7, y);

    }

    // Draw threshold lines

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.2;

    const lineXstart = yAxisW;
    const lineXend = yAxisW + canvas0.width;

    for (let i = 0; i < linesY0.length; i++) {

        if (linesY0[i] !== -1) {

            let lineY = linesY0[i] + topSpacing;
            lineY = lineY - (lineY % 1) + 0.5;

            ctx.beginPath();
            ctx.moveTo(lineXstart, lineY);
            ctx.lineTo(lineXend, lineY);
            ctx.stroke();

        }

    }

    for (let i = 0; i < linesY1.length; i++) {

        if (linesY1[i] !== -1) {

            let lineY = linesY1[i] + topSpacing + canvas0.height + plotSpacing;
            lineY = lineY - (lineY % 1) + 0.5;

            ctx.beginPath();
            ctx.moveTo(lineXstart, lineY);
            ctx.lineTo(lineXend, lineY);
            ctx.stroke();

        }

    }

    // Add titles

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillText('Time (secs)', yAxisW + (canvas0.width / 2), topSpacing + canvas0.height + plotSpacing + canvas1.height + xAxisMarkerH);

    ctx.save();
    ctx.translate(edgeSpacingW, topSpacing + (canvas0.height / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisTitle0, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(edgeSpacingW, topSpacing + canvas0.height + plotSpacing + (canvas1.height / 2));
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yAxisTitle1, 0, 0);
    ctx.restore();

    ctx.font = '13px Helvetica';
    ctx.fillText(title, yAxisW + (canvas0.width / 2), edgeSpacingH + 8);

    return canvas;

}

/**
 * Save both visible plots as "fileName.png"
 * @param {canvas[]} canvas0array Ordered array of canvas layers for top plot
 * @param {canvas[]} canvas1array Ordered array of canvas layers for bottom plot
 * @param {canvas} xAxisSVG SVG canvas containing x axis labels
 * @param {canvas} yAxis0SVG SVG canvas containing y axis labels of top plot
 * @param {canvas} yAxis1SVG SVG canvas containing y axis labels of bottom plot
 * @param {string} yAxisTitle0 Title of top plot's y axis
 * @param {string} yAxisTitle1 Title of bottom plot's y axis
 * @param {int[]} linesY0 Y co-ordinates of threshold lines on plot 0 (-1 = don't draw)
 * @param {int[]} linesY1 Y co-ordinates of threshold lines on plot 1 (-1 = don't draw)
 * @param {string} fileName Name of file being drawn
 * @param {string} title Title to be drawn at the top of the file(s)
 */
function exportPNG (canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title) {

    console.log('Exporting to PNG');

    const imageCanvas = createImageCanvas(canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title);

    // Save image

    const link = document.createElement('a');
    link.download = fileName + '_EXPORT.png';
    link.href = imageCanvas.toDataURL();
    link.click();
    link.remove();

}

/**
 * Save both visible plots as "fileName.jpg"
 * @param {canvas[]} canvas0array Ordered array of canvas layers for top plot
 * @param {canvas[]} canvas1array Ordered array of canvas layers for bottom plot
 * @param {canvas} xAxisSVG SVG canvas containing x axis labels
 * @param {canvas} yAxis0SVG SVG canvas containing y axis labels of top plot
 * @param {canvas} yAxis1SVG SVG canvas containing y axis labels of bottom plot
 * @param {string} yAxisTitle0 Title of top plot's y axis
 * @param {string} yAxisTitle1 Title of bottom plot's y axis
 * @param {int[]} linesY0 Y co-ordinates of threshold lines on plot 0 (-1 = don't draw)
 * @param {int[]} linesY1 Y co-ordinates of threshold lines on plot 1 (-1 = don't draw)
 * @param {string} fileName Name of file being drawn
 * @param {string} title Title to be drawn at the top of the file(s)
 */
function exportJPG (canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title) {

    console.log('Exporting to JPG');

    const imageCanvas = createImageCanvas(canvas0array, canvas1array, xAxisSVG, yAxis0SVG, yAxis1SVG, yAxisTitle0, yAxisTitle1, linesY0, linesY1, fileName, title);

    // Save image

    const link = document.createElement('a');
    link.download = fileName + '_EXPORT.jpg';
    link.href = imageCanvas.toDataURL('image/jpeg');
    link.click();
    link.remove();

}
