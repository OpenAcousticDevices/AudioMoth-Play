/****************************************************************************
 * drawSVG.js
 * openacousticdevices.info
 * October 2022
 *****************************************************************************/

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draw text to an SVG holder
 * @param {Element} parent SVG element to be drawn to
 * @param {string} content Text to be written
 * @param {number} x x coordinate
 * @param {number} y y coordinate
 * @param {string} anchor What end of the text it should be anchored to. Possible values: start/middle/end
 * @param {string} baseline What end of the text it should be anchored to. Possible values: text-top/middle/text-bottom
 */
function addSVGText (parent, content, x, y, anchor, baseline) {

    const textElement = document.createElementNS(SVG_NS, 'text');

    textElement.setAttributeNS(null, 'x', x);
    textElement.setAttributeNS(null, 'y', y);
    textElement.setAttributeNS(null, 'dominant-baseline', baseline);
    textElement.setAttributeNS(null, 'text-anchor', anchor);
    textElement.setAttributeNS(null, 'font-size', '9px');

    textElement.textContent = content;

    parent.appendChild(textElement);

    return textElement;

}

/**
 * Draw line to an SVG holder
 * @param {Element} parent SVG element to be drawn to
 * @param {number} x1 X coordinate of line start
 * @param {number} y1 Y coordinate of line start
 * @param {number} x2 X coordinate of line end
 * @param {number} y2 Y coordinate of line end
 */
function addSVGLine (parent, x1, y1, x2, y2) {

    const lineElement = document.createElementNS(SVG_NS, 'line');

    lineElement.setAttributeNS(null, 'x1', x1);
    lineElement.setAttributeNS(null, 'y1', y1);
    lineElement.setAttributeNS(null, 'x2', x2);
    lineElement.setAttributeNS(null, 'y2', y2);
    lineElement.setAttributeNS(null, 'stroke', 'black');

    parent.appendChild(lineElement);

    return lineElement;

}

/**
 * Draw rectangle to an SVG holder
 * @param {Element} parent SVG element to be drawn to
 * @param {number} x X co-ordinate of top left of rectangle
 * @param {number} y Y co-ordinate of top left of rectangle
 * @param {number} w Width
 * @param {number} h Height
 * @param {string} strokeCol Colour of lines
 * @param {number} strokeWidth Width of lines
 * @param {boolean} isFilled Should rectangle be filled?
 * @param {string} fillCol Colour to be filled with
 */
function addSVGRect (parent, x, y, w, h, strokeCol, strokeWidth, isFilled, fillCol) {

    const rectElement = document.createElementNS(SVG_NS, 'rect');

    rectElement.setAttributeNS(null, 'x', x);
    rectElement.setAttributeNS(null, 'y', y);
    rectElement.setAttributeNS(null, 'width', w);
    rectElement.setAttributeNS(null, 'height', h);
    rectElement.setAttributeNS(null, 'stroke', strokeCol);
    rectElement.setAttributeNS(null, 'stroke-width', strokeWidth);
    rectElement.style.fill = isFilled ? fillCol : 'none';

    parent.appendChild(rectElement);

    return rectElement;

}

/**
 * Remove an element from an SVG
 * @param {Element} parent SVG element being worked on
 * @param {Element} child Element of parent to be removed
 */
function removeSVGElement (parent, child) {

    parent.removeChild(child);

}

/**
 * Remove all SVG drawing elements from an SVG holder
 * @param {Element} parent SVG element containing labels to be cleared
 */
function clearSVG (parent) {

    while (parent.firstChild) {

        parent.removeChild(parent.lastChild);

    }

}

/**
 * Check if a text element overlaps the edge of the label canvas and shift it on if it is
 * @param {SVGElement} elem SVG element of label text
 */
function checkSVGLabelCutOff (elem) {

    const maxWidth = elem.parentElement.width.baseVal.value;

    const bbox = elem.getBBox();

    const currentX0 = bbox.x;
    const currentX1 = bbox.x + bbox.width;

    const cutOffAmount = currentX1 - maxWidth;

    if (cutOffAmount > 0) {

        elem.setAttribute('text-anchor', 'end');
        elem.setAttribute('x', maxWidth);

    } else if (currentX0 < 0) {

        elem.setAttribute('text-anchor', 'start');
        elem.setAttribute('x', 0);

    }

}
