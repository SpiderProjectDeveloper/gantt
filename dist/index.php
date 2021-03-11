<?php
require('auth.php');

if( isAuthRequired() ) {
	$userName = auth(false);
} else {
	$userName = '';
}
?>
<!DOCTYPE HTML>
<html>
<head>
	<link rel="shortcut icon" href="favicon.ico" type="image/x-icon">
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body>

<div id='appContainer' style='margin:0; padding:0; box-sizing:border-box; width:100vw; height:100vh;'></div>

<script id="bundle" src="bundle.js" data-username="<? echo($userName); ?>"  data-appcontainer="appContainer" charset="utf-8"></script>

</body>

</html>

