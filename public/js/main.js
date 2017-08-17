var socket = io.connect(window.location.hostname);

socket.on('time', function (data) {
    $('#countdown').html(data.time.value)
                   .addClass(data.time.class);

    console.log(data);
    if (data.time.end) {
    	$('#bids').addClass('end');
    	$('#bid-history').prepend($('#current-player').html()
    		                       + ': Won by '
    		                       + $('#top-bidder').html()
    		                       + $('#current-bid').html() + '<br/>');
    	$('#countdown').removeClass('running');
    } else {
    	$('#bids').removeClass('end');
    	if (data.time.running) {
    		$('#countdown').addClass('running');
    	}
    }
    //wait for next cycle of event loop to remove the class
    setTimeout(function(){$('#countdown').removeClass('pulse')},250);
});

socket.on('bid', function (bid) {
	$('#top-bidder').html(bid.topBidder + ' : $');
	$('#current-bid').html(bid.amount);
	$('#current-player').html(bid.player);
	$('#current-player-input').val(bid.player);
	$('#bid-history').prepend(bid.player + ': $' + bid.amount + ' by ' + bid.topBidder + '<br/>');
});

socket.on('player', function (player) {
	$('#current-player').html(player);
});

socket.on('reset', function() {
	$('#bid-amount').val(0);
});

socket.on('stop', function() {
	$('#countdown').removeClass('running');
});

$('#start').click(function() {
    if ($('#current-player-input').val()) {
    	socket.emit('click:start');
    } else {
    	alert('Please Cet Current Player');
    }
});

$('#stop').click(function() {
    socket.emit('click:stop');
});

$('#reset').click(function() {
    socket.emit('click:reset');
});

$('#bid').click(function() {
    var newBid = document.getElementById('bid-amount').value
    socket.emit('bid:received',
    	{
    		bidder: $.cookie('name'),
    		amount: newBid
    	}
    );
    $(this).val(newBid);
});

$('#bid-plus-one').click(function() {
    var newBid = parseInt(document.getElementById('current-bid').innerHTML) + 1;
    socket.emit('bid:received',
    	{
    		bidder: $.cookie('name'),
    		amount: newBid
    	}
    );
    $(this).val(newBid);
});

$('#bid-amount').on('keypress', function(event) {
	if (event.keyCode === 13) {
		$('#bid').click();
	}
});

$('#current-player-input').blur(function(event) {
	socket.emit('player:changed', event.target.value);
})

$('#reset-bid').change(function(event) {
	socket.emit('bid:set', event.target.value);
});

