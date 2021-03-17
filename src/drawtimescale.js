import { _settings } from './settings.js';
import { _globals, _data } from './globals.js';
import { _texts } from './texts.js';
import { timeToScreen, operToScreen } from './helpers.js';
import { createRect, createLine, createRhomb, createText } from './utils.js';

export function drawTimeScale() {
	while (_globals.timeSVG.hasChildNodes()) {
		_globals.timeSVG.removeChild(_globals.timeSVG.lastChild);
	}
	_globals.timeSVGBkgr = createRect( 0, 0, _globals.timeSVGWidth, _globals.timeSVGHeight, { fill:'url(#timeScaleGradient)' } ); 	// backgroud rect
	_globals.timeSVG.appendChild( _globals.timeSVGBkgr );			

	_globals.timeScaleToGrid = []; // To draw a grid later on the Gantt chart...

	let displayHours=0, displayDays=false, displayWeeks=false, displayMonths=0, displayYears=0;
	let hourRectWidth, dayRectWidth, weekRectWidth, monthRectWidth, yearRectWidth;
	let hoursInScreen, daysInScreen, weeksInScreen, monthsInScreen, yearsInScreen;
	let fontSize, hoursFontSize, daysFontSize, weeksFontSize, monthsFontSize, yearsFontSize;

	let maxFontSizeAccordingToSVGHeight = _globals.timeSVGHeight*0.4;

	hoursInScreen = (_globals.ganttVisibleWidth)/ (60*60);
	hourRectWidth = _globals.timeSVGWidth / hoursInScreen;
	if( hourRectWidth > _settings.minRectWidthOnTimeScale ) {
		hoursFontSize = hourRectWidth*0.75;
		if( hourRectWidth > _settings.minRectWidthOnTimeScale*2.5 ) {
			displayHours = 2;
			hoursFontSize = hourRectWidth * 0.75 / 2.5; 
		} else {
			displayHours = 1;
			hoursFontSize = hourRectWidth * 0.75; 				
		}
		if( hoursFontSize > _settings.timeScaleMaxFontSize ) {
			hoursFontSize = _settings.timeScaleMaxFontSize;
		}
		if( hoursFontSize > maxFontSizeAccordingToSVGHeight ) {
			hoursFontSize = maxFontSizeAccordingToSVGHeight;
		}
	}

	daysInScreen = hoursInScreen / 24.0;
	dayRectWidth = hourRectWidth * 24.0;
	if( dayRectWidth > _settings.minRectWidthOnTimeScale ) {
		displayDays = true;		
		daysFontSize = dayRectWidth*0.75;
		if( daysFontSize > _settings.timeScaleMaxFontSize ) {
			daysFontSize = _settings.timeScaleMaxFontSize;
		}
		if( daysFontSize > maxFontSizeAccordingToSVGHeight ) {
			daysFontSize = maxFontSizeAccordingToSVGHeight;
		}
	}

	if( !displayDays ) {
		weeksInScreen = daysInScreen / 7.0;
		weekRectWidth = dayRectWidth * 7.0;
		if( weekRectWidth > _settings.minRectWidthOnTimeScale )	{
			displayWeeks = true;
		}
		weeksFontSize = weekRectWidth*0.75;
		if( weeksFontSize > _settings.timeScaleMaxFontSize ) {
			weeksFontSize = _settings.timeScaleMaxFontSize;
		}
		if( weeksFontSize > maxFontSizeAccordingToSVGHeight ) {
			weeksFontSize = maxFontSizeAccordingToSVGHeight;
		}
	}
	if( displayHours == 0 ) {
		monthsInScreen = daysInScreen / 30.0;
		monthRectWidth = dayRectWidth * 30.0;
		if( monthRectWidth > _settings.minRectWidthOnTimeScale ) {
			if( monthRectWidth > _settings.minRectWidthOnTimeScale*5 ) {
				displayMonths = 3;
				monthsFontSize = monthRectWidth * 0.75 / 5.0; 
			} else if( monthRectWidth > _settings.minRectWidthOnTimeScale*1.5 ) {
				displayMonths = 2;
				monthsFontSize = monthRectWidth * 0.75 / 1.5; 
			} else {
				displayMonths = 1;
				monthsFontSize = monthRectWidth * 0.75; 				
			}
			if( monthsFontSize > _settings.timeScaleMaxFontSize ) {
				monthsFontSize = _settings.timeScaleMaxFontSize;
			}
			if( monthsFontSize > maxFontSizeAccordingToSVGHeight ) {
				monthsFontSize = maxFontSizeAccordingToSVGHeight;
			}			
		}
	}

	if( !displayDays && displayMonths != 3 ) {
		yearsInScreen = daysInScreen / 365.0;
		yearRectWidth = dayRectWidth * 365.0;
		if( yearRectWidth > _settings.minRectWidthOnTimeScale ) {
			if( yearRectWidth > _settings.minRectWidthOnTimeScale * 2 ) {
				displayYears = 2;
				yearsFontSize = yearRectWidth * 0.75 / 2;
			} else {
				displayYears = 1;
				yearsFontSize = yearRectWidth * 0.75;				
			}
			if( yearsFontSize > _settings.timeScaleMaxFontSize ) {
				yearsFontSize = _settings.timeScaleMaxFontSize;
			}
			if( yearsFontSize > maxFontSizeAccordingToSVGHeight ) {
				yearsFontSize = maxFontSizeAccordingToSVGHeight;
			}			
		}
	}

	let height = _globals.timeSVGHeight / 2.0;
	let textProperties = { fill:_settings.timeScaleFontColor, textAnchor:'middle', alignmentBaseline:'baseline' };
	let rectProperties = { fill:'none', stroke:_settings.timeScaleStrokeColor, strokeWidth:0.25 };

	//let minTime = _data.visibleMin * 1000; // screenToTime(0) * 1000;
	//let maxTime = _data.visibleMax * 1000; // screenToTime( _timeSVGWidth ) * 1000;
	let minTime = _globals.ganttVisibleLeft * 1000; // screenToTime(0) * 1000;
	let maxTime = minTime + _globals.ganttVisibleWidth * 1000; // screenToTime( _globals.timeSVGWidth ) * 1000;
	let minDT = new Date(minTime);
	let maxDT = new Date(maxTime);
	let minY = minDT.getUTCFullYear();
	let maxY = maxDT.getUTCFullYear();

	let rowNumber = 2;
	if( displayHours != 0 ) {
		textProperties.fontSize = hoursFontSize;
		rectProperties._rowNumber = rowNumber;
		rectProperties._top = (rowNumber - 1) * height;
		rectProperties._height = height;
		drawTimeScaleHours( rectProperties, textProperties, displayHours, minDT, maxDT );
		rowNumber -= 1;
	}

	// Adjusting to the beginning of day
	minDT = new Date( Date.UTC( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), 0, 0, 0, 0 ) );
	maxDT = new Date( Date.UTC( maxDT.getUTCFullYear(), maxDT.getUTCMonth(), maxDT.getUTCDate(), 0, 0, 0, 0 ) );

	if( displayDays && rowNumber > 0 ) {
		textProperties.fontSize = daysFontSize;
		rectProperties._rowNumber = rowNumber;
		rectProperties._top = (rowNumber - 1) * height;
		rectProperties._height = height;
		drawTimeScaleDays( rectProperties, textProperties, minDT, maxDT  );
		rowNumber -= 1;
	}

	if( displayWeeks && rowNumber > 0 ) {
		textProperties.fontSize = weeksFontSize;
		rectProperties._rowNumber = rowNumber;
		rectProperties._top = (rowNumber - 1) * height;
		rectProperties._height = height;		
		drawTimeScaleWeeks( rectProperties, textProperties, minDT, maxDT );
		rowNumber -= 1;		
	}

	if( displayMonths != 0 && rowNumber > 0 ) {
		textProperties.fontSize = monthsFontSize;
		rectProperties._rowNumber = rowNumber;
		rectProperties._top = (rowNumber - 1) * height;
		rectProperties._height = height;		
		drawTimeScaleMonths( rectProperties, textProperties, displayMonths, minY, maxY, minDT, maxDT );
		rowNumber -= 1;				
	}

	if( displayYears != 0 && rowNumber > 0 ) {
		textProperties.fontSize = yearsFontSize;
		rectProperties._rowNumber = rowNumber;
		rectProperties._top = (rowNumber - 1) * height;
		rectProperties._height = height;		
		drawTimeScaleYears( rectProperties, textProperties, displayYears, minY, maxY );
	}

	// Drawing gantt grid...
  	for( let i = 0 ;  ; i++ ) {
		let el = document.getElementById( 'ganttBkgrGrid' + i );
		if( !el ) {
			break;
		}
		_globals.ganttSVG.removeChild(el);
	}

	let ganttHeight = operToScreen(_data.activities.length);

	let gridLineProperties = { stroke:_settings.gridColor, strokeWidth:_settings.gridStrokeWidth, strokeDasharray:_settings.gridStrokeDashArray }; 
	for( let i = 0 ; i < _globals.timeScaleToGrid.length ; i++ ) {
		let x = timeToScreen( _globals.timeScaleToGrid[i] );
		gridLineProperties.id = 'ganttBkgrGrid' + i;
		let line = createLine( x, 0, x, ganttHeight, gridLineProperties );
		_globals.ganttSVG.appendChild(line);
	}		
	let gridXNow = timeToScreen( _data.project.curTimeInSeconds );
	gridLineProperties.id = 'ganttBkgrGrid' + _globals.timeScaleToGrid.length;
	gridLineProperties.stroke = _settings.gridCurrentTimeColor;
	gridLineProperties.strokeWidth = _settings.gridCurrentTimeStrokeWidth;
	gridLineProperties.strokeDasharray = null; //_settings.gridStrokeDashArray;
	let gridLine = createLine( gridXNow, 0, gridXNow, ganttHeight, gridLineProperties );
	_globals.ganttSVG.appendChild(gridLine);
}


function drawTimeScaleYears( rectProperties, textProperties, displayYears, minY, maxY ) {
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;

	for( let y = minY ; y <= maxY ; y++ ) {
		if( minY == maxY ) {
			let yearText = createText( minY, _globals.timeSVGWidth/2, bottom-3, textProperties );
			_globals.timeSVG.appendChild(yearText);
		} else {
			let startOfYear = new Date( Date.UTC(y,0,1,0,0,0,0) );
			let startOfYearInSeconds = startOfYear.getTime() / 1000;
			let endOfYear = new Date( Date.UTC(y,11,31,23,59,59,999) );
			let endOfYearInSeconds = endOfYear.getTime() / 1000;
			let yearStartX = timeToScreen(startOfYearInSeconds, false);
			let yearEndX = timeToScreen(endOfYearInSeconds, false);
			let yearRect = createRect( yearStartX, top, yearEndX - yearStartX, height, rectProperties );		
			_globals.timeSVG.appendChild(yearRect);

			let text;
			if( displayYears == 1 ) { // 2-digit format
				text = parseInt(y.toString().slice(-2));
			} else { // 4-digit format
				text = y.toString();
			}
			let yearText = createText( text, yearStartX + (yearEndX - yearStartX)/2, bottom-3, textProperties );
			_globals.timeSVG.appendChild(yearText);
			if( rectProperties._rowNumber == 2 ) {
				_globals.timeScaleToGrid.push(endOfYearInSeconds); // To draw a grid later on the Gantt chart...
			}			
		}
	}
}


function drawTimeScaleMonths( rectProperties, textProperties, displayMonths, minY, maxY, minDT, maxDT ) {
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;

	for( let y = minY ; y <= maxY ; y++ ) {
		let minM = ( y == minY ) ? minDT.getUTCMonth() : 0;
		let maxM = ( y == maxY ) ? maxDT.getUTCMonth() : 11;
		let mNames = _texts[_globals.lang]['monthNames']
		for( let m = minM ; m <= maxM ; m++ ) {
			let startOfMonth = new Date( Date.UTC(y,m,1,0,0,0,0) );
			let startOfMonthInSeconds = startOfMonth.getTime() / 1000;
			let endOfMonth = new Date( Date.UTC(y,m+1,0,23,59,59,999) );
			let endOfMonthInSeconds = endOfMonth.getTime() / 1000;
			let monthStartX = timeToScreen(startOfMonthInSeconds, false);
			let monthEndX = timeToScreen(endOfMonthInSeconds, false);
			let monthRect = createRect( monthStartX, top, monthEndX - monthStartX, height, rectProperties );		
			_globals.timeSVG.appendChild(monthRect);
			let text;
			if( displayMonths == 3 ) { // Display with year
				let yearShort = y.toString().slice(-2);
				text = mNames[m] + "'" + yearShort;
			} else if( displayMonths == 2 ) { // Display with name
				text = mNames[m];
			} else { // Display with digits
				text = (m+1).toString();
			}
			let monthText = createText( text, monthStartX + (monthEndX - monthStartX)/2, bottom-3, textProperties );
			_globals.timeSVG.appendChild(monthText);
			if( rectProperties._rowNumber == 2 ) {
				_globals.timeScaleToGrid.push(endOfMonthInSeconds); // To draw a grid later on the Gantt chart...
			}			
		}
	}
}


function drawTimeScaleWeeks( rectProperties, textProperties, minDT, maxDT ) {
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInDay = 24 * 60 * 60;
	let numSecondsInWeek = 7 * numSecondsInDay;

	let firstDay = minDT.getUTCDay(); // To adjust to the beginning of a week.
	if( firstDay == 0 ) { // If Sunday... 
		firstDay = 7; // ... making it 7 instead of 0
	}
	let startDT;
	if( firstDay > 1 ) { // If not monday...
		startDT = new Date( minDT.getTime() - numSecondsInDay*1000*(firstDay-1) ); // ... making it Monday
	} else {
		startDT = new Date( Date.UTC( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), 0, 0, 0, 0 ) );
	}

	let startOfWeekInSeconds = startDT.getTime() / 1000;
	let endOfWeekInSeconds = startOfWeekInSeconds + numSecondsInWeek;
	let endInSeconds = maxDT.getTime()/1000 + numSecondsInWeek - 1;		
	for( ; startOfWeekInSeconds < endInSeconds ; ) {
		let weekStartX = timeToScreen(startOfWeekInSeconds, false);
		let weekEndX = timeToScreen(endOfWeekInSeconds, false);
		let weekRect = createRect( weekStartX, top, weekEndX - weekStartX, height, rectProperties );		
		_globals.timeSVG.appendChild(weekRect);
		let startOfWeekDate = new Date( startOfWeekInSeconds*1000 );
		let weekText = createText( (startOfWeekDate.getUTCDate()).toString(), 
			weekStartX + (weekEndX - weekStartX)/2, bottom-3, textProperties );
		_globals.timeSVG.appendChild(weekText);
		if( rectProperties._rowNumber == 2 ) {
			_globals.timeScaleToGrid.push(endOfWeekInSeconds); // To draw a grid later on the Gantt chart...
		}
		startOfWeekInSeconds = endOfWeekInSeconds;
		endOfWeekInSeconds += numSecondsInWeek;
	}								
}


function drawTimeScaleDays( rectProperties, textProperties, minDT, maxDT ) {
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInDay = 24 * 60 * 60;

	let startOfDayInSeconds = minDT.getTime() / 1000;
	let endOfDayInSeconds = startOfDayInSeconds + numSecondsInDay;
	let endInSeconds = maxDT.getTime()/1000 + 1;		
	for( ; startOfDayInSeconds < endInSeconds ; ) {
		let dayStartX = timeToScreen(startOfDayInSeconds, false);
		let dayEndX = timeToScreen(endOfDayInSeconds, false);
		let dayRect = createRect( dayStartX, top, dayEndX - dayStartX, height, rectProperties );		
		_globals.timeSVG.appendChild(dayRect);
		let startOfDayDate = new Date( startOfDayInSeconds*1000 );
		let dayText = createText( (startOfDayDate.getUTCDate()).toString(), 
			dayStartX + (dayEndX - dayStartX)/2, bottom-3, textProperties );
		_globals.timeSVG.appendChild(dayText);
		if( rectProperties._rowNumber == 2 ) {
			_globals.timeScaleToGrid.push(endOfDayInSeconds); // To draw a grid later on the Gantt chart...
		}		
		startOfDayInSeconds = endOfDayInSeconds;
		endOfDayInSeconds += numSecondsInDay;
	}								
}


function drawTimeScaleHours( rectProperties, textProperties, displayHours, minDT, maxDT ) {
	let top = rectProperties._top;
	let height = rectProperties._height;
	let bottom = top + height;
	let numSecondsInHour = 60 * 60;

	let startDT = new Date( Date.UTC( minDT.getUTCFullYear(), minDT.getUTCMonth(), minDT.getUTCDate(), minDT.getUTCHours(), 0, 0, 0 ) );
	let endDT = new Date( Date.UTC( maxDT.getUTCFullYear(), maxDT.getUTCMonth(), maxDT.getUTCDate(), maxDT.getUTCHours(), 0, 0, 0 ) );

	let currentHour = startDT.getUTCHours();
	let startOfHourInSeconds = startDT.getTime() / 1000;
	let endOfHourInSeconds = startOfHourInSeconds + numSecondsInHour;
	let endInSeconds = endDT.getTime()/1000 + 1;		
	for( ; startOfHourInSeconds < endInSeconds ; ) {
		let hourStartX = timeToScreen(startOfHourInSeconds, false);
		let hourEndX = timeToScreen(endOfHourInSeconds, false);
		let hourRect = createRect( hourStartX, top, hourEndX - hourStartX, height, rectProperties );		
		_globals.timeSVG.appendChild(hourRect);

		let text = currentHour.toString();
		if( currentHour < 10 ) {
			text = "0" + text;
		}
		if( displayHours == 2 ) { // Display minutes
			text = text + ":00";			
		}
		let hourText = createText( text, hourStartX + (hourEndX - hourStartX)/2, bottom-3, textProperties );
		_globals.timeSVG.appendChild(hourText);
		if( rectProperties._rowNumber == 2 ) {
			_globals.timeScaleToGrid.push(endOfHourInSeconds); // To draw a grid later on the Gantt chart...
		}		
		startOfHourInSeconds = endOfHourInSeconds;
		endOfHourInSeconds += numSecondsInHour;
		currentHour = (currentHour < 23) ? (currentHour+1) : 0;
	}								
}
