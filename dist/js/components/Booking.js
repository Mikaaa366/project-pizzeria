import { templates, select, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';


class Booking {
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.dataTable = null;
    
  } 
  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const EndDateParam  = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        EndDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        EndDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        EndDateParam,
      ],
      
    };
    console.log('getData params:', params);

    const urls={
      booking:       settings.db.url+ '/' + settings.db.bookings + 
                                      '?' + params.booking.join('&')  ,
      eventsCurrent: settings.db.url+ '/' + settings.db.events   + 
                                      '?' + params.eventsCurrent.join('&') ,
      eventsRepeat:  settings.db.url+ '/' + settings.db.events    + 
                                      '?' + params.eventsRepeat.join('&') ,
    };
  
    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const bookingsResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        // console.log(bookings);
        // console.log(eventsCurrent);
        // console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    
    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }

    }
    // console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this; 
    
    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

  


    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      // console.log('loop', hourBlock);

      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];

      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (
        !allAvailable 
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = element.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = element.querySelector(select.booking.hoursAmount);
    
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    
    thisBooking.dom.tables = element.querySelectorAll(select.booking.tables);
    

    thisBooking.dom.selectedTable = thisBooking.dom.wrapper.querySelector(select.booking.selectedTable);

    thisBooking.dom.phoneNumber = thisBooking.dom.wrapper.querySelector(select.cart.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.cart.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.cart.starters);
    thisBooking.dom.formB = thisBooking.dom.wrapper.querySelector(select.booking.formB);
    thisBooking.dom.tableButton= thisBooking.dom.wrapper.querySelector(select.booking.tableButton);

  }
  



  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.dom.peopleAmount.addEventListener('updated', function () {});

    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.dom.hoursAmount.addEventListener('updated', function () {});

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.wrapper.addEventListener('updated', function (){
      thisBooking.updateDOM();
    });

    thisBooking.dom.selectedTable.addEventListener('click', function (event) {
      const clickOnTable = event.target;
      if (clickOnTable.classList.contains('table'))
        thisBooking.initTables(clickOnTable);
    });
    thisBooking.dom.datePicker.addEventListener('updated', function () {
      thisBooking.resetTables();
    });
    thisBooking.dom.hourPicker.addEventListener('updated', function () {
      thisBooking.resetTables();
    });

    thisBooking.dom.tableButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });


  

  }
  resetTables(){
    const thisBooking = this;
    for (let table of thisBooking.dom.tables) {
      table.classList.remove('selected');
    }
  }

  initTables(clickOnTable) {
    const thisBooking = this;

    const tableId = clickOnTable.getAttribute(settings.booking.tableIdAttribute);

    if (clickOnTable.classList.contains('booked')) {
      alert('this table is booked');
    } else {
      if (clickOnTable.classList.contains('selected')) {
        clickOnTable.classList.remove('selected');
        thisBooking.dataTable = null;
        thisBooking.resetTables();
      } else {
        thisBooking.resetTables();
        clickOnTable.classList.add('selected');
        
        thisBooking.dataTable = tableId;
      }
    }
  }

  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.bookings;

    const payload = {
      date: thisBooking.date,
      hour: utils.numberToHour(thisBooking.hour),
      duration: parseInt(thisBooking.hoursAmount.value),
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phoneNumber.value,
      address: thisBooking.dom.address.value,
    };

    console.log('booking', thisBooking.dom.starters);

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(
          parsedResponse.date,
          parsedResponse.hour,
          parsedResponse.duration,
          parsedResponse.table
        );
        thisBooking.updateDOM();
        console.log(thisBooking.booked);
      });
  }

}


export default Booking;