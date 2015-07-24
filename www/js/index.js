var map;
var marker;
var watchID;

// global variables
var db;
var shortName = 'restDb';
var version = '1.0';
var displayName = 'restDb';
var maxSize = 65535;

var dbCreated = false;

var cartTotal = 0;

$(document).ready(function(){
    
    $(".bxslider").bxSlider({
        minSlides: 3,
        maxSlides: 3,
        slideWidth: 300,
        slideMargin: 3,
        ticker: true,
        speed: 100000
    });
    
    document.addEventListener("deviceready", onDeviceReady, false);    
    //onDeviceReady();
});

$("#btnClearCart").click(function(event){
   //navigator.notification.alert("asdasd",null);
    navigator.notification.confirm("Are you sure you want to clear the order?", onClearConfirm, "Confirm", ['Yes', 'No']);
});

$("#payOrder").click(function(event){
   navigator.notification.confirm("Are you sure you want to proceed?", onClearConfirm, "Transaction Confirm", ['Yes', 'No']);
    
});

function onClearConfirm(buttonIndex){
    if(buttonIndex == 1){
        clearCart();
    }
}
    
function onDeviceReady() {    
    if (!window.openDatabase) {
        alert('Databases are not supported in this browser.');
        return;
    }
    
    max_height();
    google.load("maps", "3.8", {"callback": map, other_params: "sensor=true&language=en"});
    
    db = window.openDatabase(shortName, version, displayName, maxSize);
    
    if (dbCreated){
    	db.transaction(getEmployees, errorHandler);
    }
    
    else {
        db.transaction(populateDB, errorHandler, populateDB_success);
    }
}

$("#frmLogin").submit(function(){

    var username = $("#txtUsername").val();
    var password = $("#txtPassword").val();
    
    if (!username || !password){
        navigator.notification.alert("Invalid login details", null, "Error", "OK")            
    }
    
    else{
        $("#welcomeName").text("Logged in as: " + username);
        
        $("#txtUsername").val("");
        $("#txtPassword").val("");
        
        $.mobile.changePage("#home");        
    }
    
    return false;    
});

$("#btnMenuExit").click(function(){
    db.transaction(populateDB, errorHandler, populateDB_success);
    $.mobile.changePage("#login");        

});


///////////////////////////////////////////////////////////////////////////////////////////
//
//Database methods
//
//////////////////////////////////////////////////////////////////////////////////////////

function errorHandler(tx, error) {
   alert('Error: ' + error.message + ' code: ' + error.code);
}

function successCallBack() {
   alert('Success');
}

function nullHandler(){};

function populateDB_success() {
	dbCreated = true;
    
    db.transaction(getEmployees, errorHandler);
    
    $("#itemCount").html("<h5>Oops! no items found in your order</h5>");        
}

function clearCart(){
    db.transaction(function(tx){
        var sql = "delete from Cart";
        tx.executeSql(sql,[], getCart);
    },errorHandler)
}

function getItemById(id){
    db.transaction(function(tx){
        var sql = "select * from FoodItem where id = ?";
        tx.executeSql(sql, [id], addItemToCart);        
    }, errorHandler);
}

function addItemToCart(tx, results){
    var foodItem = results.rows.item(0);
    var sql = "INSERT INTO Cart (id, quantity) VALUES (?,?)";    
    tx.executeSql(sql, [foodItem.id, 1], getCart);
}

function getCart(tx){
    var sql = 
        "select f.id as id, f.name as name, f.picture as picture, count(*) as count, sum(f.price) as subtotal " +
        "from Cart c, FoodItem f " +
        "where c.id = f.id " +
        "group by f.name, f.picture";
    tx.executeSql(sql,[],getCart_success);
}

function getCart_success(tx, results) {
    navigator.notification.alert("Item has been added to the cart.", null,"Success");
    
    var len = results.rows.length;     
    
    if(len == 0){
        $("#itemCount").html("<h5>Oops! no items found in your order</h5>");        
    }
    else{
        $("#itemCount").html("");
    }
    
    cartTotal = 0;
    
    $('#cartItems li').addClass('ui-screen-hidden'); 
    
    for (var i=0; i<len; i++) {
    	var cartItem = results.rows.item(i);
        
        cartTotal += cartItem.subtotal;
        
        $("#cartItems").append(
            '<li data-icon="gear">' +
            '<img src="img/food/'+ cartItem.picture +'" />' +
            '<h5>' + cartItem.name + '</h5>' +
            '<p>' + cartItem.count + " nos - " + cartItem.subtotal + ' Rs.</p>' +
            '</li>'            
        );
        
        /*
        markup += '<li>' +
            '<img src="img/food/'+ cartItem.picture +'" />' +
            '<h5>' + cartItem.name + '</h5>' +
            '<p>' + cartItem.count + " nos - " + cartItem.subtotal + ' Rs.</p>' +
            '</li>';            
        */
    }
        
    $('#cartItems').listview().listview('refresh');
    
    $("#totalAmount").html(cartTotal + ".00 Rs");
    $("#totalPay").html(cartTotal + ".00 Rs");
}

function getEmployees(tx) {
	var sql = "select * from FoodItem";
	tx.executeSql(sql, [], getEmployees_success);
}

function getEmployees_success(tx, results) {
	//$('#busy').hide();
    var len = results.rows.length;
        
    $("#foodItems").empty();
    
    for (var i=0; i<len; i++) {
    	var foodItem = results.rows.item(i);
        
        $("#foodItems").append(
            '<li onclick="getItemById(' + foodItem.id + ')" data-icon="gear">' +
            '<img src="img/food/'+ foodItem.picture +'" />' +
            '<h5>' + foodItem.name + " / " + "<i>(" + foodItem.category + ")</i></h5>" +
            '<p>' + foodItem.price + ' Rs.</p>' +
            '</li>'            
        );        
    }
}

function populateDB(tx) {
	tx.executeSql('DROP TABLE IF EXISTS FoodItem');
    
    tx.executeSql('DROP TABLE IF EXISTS Cart');
    
	var sql = 
		"CREATE TABLE IF NOT EXISTS FoodItem ( "+
		"id INTEGER PRIMARY KEY AUTOINCREMENT, " +
		"name VARCHAR(50), " +
		"category VARCHAR(50), " +
		"price double, " +
		"picture VARCHAR(50) ) ";

    var sql2 = 
		"CREATE TABLE IF NOT EXISTS Cart ( id INTEGER, quantity INTEGER ) "; 
    
    tx.executeSql(sql);    
    tx.executeSql(sql2);
    
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Biriyani','Rice',300.00,'biriyani.jpg')");
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Fried Rice','Rice',180.00,'fried.jpg')");
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Steamed Rice','Rice',120.00,'steamed.jpg')");
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Chicken Pizza(S)','Pizza',390.00,'pizzasmall.jpg')");
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Chicken Pizza(R)','Pizza',790.00,'mediumpizza.jpg')");
    tx.executeSql("INSERT INTO FoodItem (name,category,price,picture) VALUES ('Chicken Pizza(L)','Pizza',1470.00,'chickenpizza.jpg')");    
}

//////////////////////////////////////////////////////////////////////////////
//
//Map methods
//
//////////////////////////////////////////////////////////////////////////////

function max_height() {
    var h = $('div[data-role="header"]').outerHeight(true);
    var f = $('div[data-role="footer"]').outerHeight(true);
    var w = $(window).height();
    var c = $('div[data-role="content"]');
    var c_h = c.height();
    var c_oh = c.outerHeight(true);
    var c_new = w - h - f - c_oh + c_h;
    var total = h + f + c_oh;
    if (c_h < c.get(0).scrollHeight) {
        c.height(c.get(0).scrollHeight);
    } else {
        c.height(c_new);
    }
}

function map() {
    var latlng = new google.maps.LatLng(6.91, 79.97);
    var myOptions = {
        zoom: 15,
        center: latlng,
        streetViewControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoomControl: true
    };
    map = new google.maps.Map(document.getElementById("map"), myOptions);

    google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
        watchID = navigator.geolocation.watchPosition(gotPosition, null, {maximumAge: 5000, timeout: 60000, enableHighAccuracy: true});
    });
}

function gotPosition(position) {
    map.setCenter(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));

    var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    if (!marker) {
        //create marker
        marker = new google.maps.Marker({
            position: point,
            map: map
        });
    } else {
        //move marker to new position
        marker.setPosition(point);
    }
}