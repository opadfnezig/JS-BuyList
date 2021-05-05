/**
 * Created by chaika on 02.02.16.
 */
var Templates = require('../Templates');
var PizzaCart = require('./PizzaCart');
var Pizza_List = require('../Pizza_List');
var API = require('../API');

//HTML елемент куди будуть додаватися піци
var $pizza_list = $("#pizza_list");
var $number_field = $("#number-pizza")[0];

var directionsRenderer = new google.maps.DirectionsRenderer();

var homeMraker = null;

// For text check
var nameI = false, phoneI = false, addressI = false;

function showPizzaList(list) {
    //Очищаємо старі піци в кошику
    if(!$number_field)
        return;
    $pizza_list.html("");
    $number_field.innerText = list.length;
    //Онволення однієї піци
    function showOnePizza(pizza) {
        var html_code = Templates.PizzaMenu_OneItem({pizza: pizza});

        var $node = $(html_code);

        $node.find(".buy-big").click(function(){
            PizzaCart.addToCart(pizza, PizzaCart.PizzaSize.Big);
        });
        $node.find(".buy-small").click(function(){
            PizzaCart.addToCart(pizza, PizzaCart.PizzaSize.Small);
        });

        $pizza_list.append($node);
    }

    list.forEach(showOnePizza);
}

function filterPizza(filter) {
    //Масив куди потраплять піци які треба показати
    var pizza_shown = [];
    if (filter === 'all') {
        Pizza_List.forEach(function (pizza) {
            //Якщо піка відповідає фільтру

            pizza_shown.push(pizza);
        });
    }
    else if (filter === 'vega'){
        Pizza_List.forEach(function (pizza) {
            //Якщо піка відповідає фільтру
            if (!pizza.content.meat && !pizza.content.ocean){
                pizza_shown.push(pizza);}
        });
    }
    else {
        Pizza_List.forEach(function (pizza) {
            //Якщо піка відповідає фільтру

            for (const [key] of Object.entries(pizza.content)) {
                if (key === filter) {
                    pizza_shown.push(pizza);
                }
            }
        });
    }

    //Показати відфільтровані піци
    showPizzaList(pizza_shown);
}

function initialiseMenu() {
    //Показуємо усі піци
    $("#sort-all").click(function() {
       filterPizza("all");
    });
    $("#sort-meat").click(function() {
        filterPizza("meat")
    });
    $("#sort-chicken").click(function () {
        filterPizza("chicken");
    });
    $("#sort-seafood").click(function () {
        filterPizza("ocean");
    });
    $("#sort-pineapple").click(function () {
        filterPizza("pineapple");
    });
    $("#sort-mushroom").click(function () {
        filterPizza("mushroom");
    });

    $("#sort-vega").click(function () {
        filterPizza("vega");
    });
    showPizzaList(Pizza_List)
}

function checkTextFields() {
    if(nameI && phoneI && addressI)
        document.getElementById("submit-order").disabled = false;
    else
        document.getElementById("submit-order").disabled = true;
}

$("#nameInput").keyup(function(){
    if (this.value.match("^([А-ЯІЇ]{1}[а-яёії]{1,23}|[A-Z]{1}[a-z]{1,23})$")){
        $("#name").css("color","green");
        $("#nameError").text("");
        nameI = true;
    } else {
        $("#name").css("color","red");
        $("#nameError").text("Введіть правильне ім'я");
        $("#nameError").css("color","red");
        nameI = false
    }
    checkTextFields();
});

$("#phoneInput").keyup(function(){
    if (!this.value.match("^([0|\\+[0-9]{1,5})?([7-9][0-9]{10})$")){
        $("#phone").css("color","red");
        $("#phoneError").text("Введіть правильний номер телефону");
        $("#phoneError").css("color","red");
        phoneI = false;
    }
    else {
        $("#phone").css("color","green");
        $("#phoneError").text("");
        phoneI = true;
    }
    checkTextFields();
});

$("#addressInput").keyup(function(){
    if (this.value.match("^[а-яіїА-ЯІЇ0-9,\\.\\s]+$")){
        $("#address").css("color","green");
        $("#addressError").text("");
        addressI = true;
    } else {
        $("#address").css("color","red");
        $("#addressError").text("Введіть правильну адресу");
        $("#addressError").css("color","red");
        addressI = false;
    }
    checkTextFields();
});

function	geocodeLatLng(latlng,	 callback){
    var geocoder	=	new	google.maps.Geocoder();
    geocoder.geocode({'location':	latlng},	function(results,	status)	{
        if	(status	===	google.maps.GeocoderStatus.OK&&	results[1])	{
            var adress =	results[1].formatted_address;
            callback(null,	adress);
        }	else	{
            callback(new	Error("Can't	find	adress"));
        }
    });
}

function sendToBack(error, data) {
    let receipt_details = data;
    if (!error) {
        LiqPayCheckout.init({
            data:	receipt_details.data,
            signature:	receipt_details.signature,
            embedTo:	"#liqpay",
            mode:	"popup"	//	embed	||	popup
        }).on("liqpay.callback",	function(data){
            console.log(data.status);
            console.log(data);
        }).on("liqpay.ready",	function(data){
//	ready
        }).on("liqpay.close",	function(data){
//	close
        });
    }
    else{
        console.log('some error');
    }
}

$("#submit-order").click(function () {

    var phoneNumber = $("#phoneInput").val();
    var login = $("#nameInput").val();
    var address = $("#addressInput").val();
    if (phoneNumber === "" || login === "" || address === "") {
        return;
    }
    var pizza = [];
    PizzaCart.getPizzaInCart().forEach(element =>
        pizza.push(element));
    var order_info = {
        phoneNumber: phoneNumber,
        login: login,
        address: address,
        pizzas: pizza
    }
    API.createOrder(order_info, sendToBack);
});

function	geocodeAddress(address,	 callback)	{
    var geocoder	=	new	google.maps.Geocoder();
    geocoder.geocode({'address':	address},	function(results,	status)	{
        if	(status	===	google.maps.GeocoderStatus.OK&&	results[0])	{
            var coordinates	=	results[0].geometry.location;
            callback(null,	coordinates);
        }	else	{
            callback(new	Error("Can	not	find	the	adress"));
        }
    });
}

function	calculateRoute(A_latlng,	 B_latlng,	callback)	{
    var directionService = new google.maps.DirectionsService();
    directionService.route({
        origin:	A_latlng,
        destination:	B_latlng,
        travelMode:	google.maps.TravelMode["DRIVING"]
    },	function(response,	status)	{
        if	(	status	==	google.maps.DirectionsStatus.OK )	{
            var leg	=	response.routes[	0	].legs[	0	];
            directionsRenderer.setDirections(response);
            callback(null,	{
                duration:	leg.duration
            });
        }	else	{
            callback(new	Error("Can'	not	find	direction"));
        }
    });
}



function	initialize()	{
//Тут починаємо працювати з картою
    var mapProp =	{
        center:	new	google.maps.LatLng(50.464379,30.519131),
        zoom:	11
    };
    var html_element =	document.getElementById("googleMap");
    var map	= new google.maps.Map(html_element,	 mapProp);

    var point	=	new	google.maps.LatLng(50.464379,30.519131);
    var marker	=	new	google.maps.Marker({
        position:	point,
        map:	map,
        icon:	"assets/images/map-icon.png"
    });



    directionsRenderer.setMap(map);

    $("#addressInput").keyup(function(){
        geocodeAddress(this.value, function(error, adress) {
            if(!error) {
                if(!homeMraker) {
                    homeMraker = new google.maps.Marker({
                        position: adress,
                        map: map,
                        icon: "assets/images/home-icon.png"
                    });
                } else {
                    homeMraker.setPosition(adress);
                }
                geocodeLatLng(adress, function(error, adr) {
                    $("#addressOrder").text(adr);
                });
                calculateRoute(marker.position, homeMraker.position, function(error, distance) {
                    if(!error) {
                        $("#timeOrder").text(distance.duration.text);
                    } else {
                        $("#timeOrder").text("невідомо");
                    }
                });
            }
            else
                console.log(adress);
        });
    });

    google.maps.event.addListener(map,
        'click',function(me){
            var coordinates	=	me.latLng;
            geocodeLatLng(coordinates,	function(err,	adress){
                if(!err)	{
                    $("#addressInput").val(adress);
                    $("#addressOrder").text(adress);
                    $("#address").css("color","green");
                    $("#addressError").text("");
                    addressI = true;
                    checkTextFields();
                    if(!homeMraker) {
                        homeMraker = new google.maps.Marker({
                            position: coordinates,
                            map: map,
                            icon: "assets/images/home-icon.png"
                        });
                    } else {
                        homeMraker.setPosition(coordinates);
                    }
                    calculateRoute(marker.position, homeMraker.position, function(error, distance) {
                        if(!error) {
                            $("#timeOrder").text(distance.duration.text);
                        } else {
                            $("#timeOrder").text("невідомо");
                        }
                    });
                }	else	{
                    console.log("Немає адреси")
                }
            })
        });

}

google.maps.event.addDomListener(window, 'load', initialize);



exports.filterPizza = filterPizza;
exports.initialiseMenu = initialiseMenu;