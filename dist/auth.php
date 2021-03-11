<?php

$s_AuthUsersFile = "users.php";

$s_AuthorizationFailedHTML = "<html><body><h1>Authentification failed</h1><h3>Please, reload the page and try again!</h3></body></html>";
$s_AuthorizationFailed = "Authentification failed!";

function isAuthRequired() {
	global $s_AuthUsersFile;
	global $s_AuthorizationFailed;

	$bReturn = true;

	if( file_exists( $s_AuthUsersFile ) ) {
		$fileHandle = fopen( $s_AuthUsersFile, 'rb' );
		if( $fileHandle != FALSE ) {
			$sLine = fgets( $fileHandle );
			if( strncmp( $sLine, "NOAUTH", 6 ) == 0 ) {
				$bReturn = false;
			}
			fclose( $fileHandle );
		} 
	}
	return $bReturn;
}


function auth( $bAjax=false ) {
	global $s_AuthUsersFile;
	global $s_AuthorizationFailedHTML, $s_AuthorizationFailed;

	if( $_SERVER['QUERY_STRING'] == 'logout' ) {
		header("HTTP/1.0 401 Unauthorized");
		echo "<script>window.location.replace('http://www.spiderproject.com/');</script>";
		exit();
	}

	if( !isset( $_SERVER['PHP_AUTH_USER'] ) ) { // PHP_AUTH_USER may not be set due to FastCGI server API used...
		if (isset($_SERVER['HTTP_AUTHORIZATION']) && (strlen($_SERVER['HTTP_AUTHORIZATION']) > 0)) {
        	list( $_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW'] ) = 
        		explode(':', base64_decode( substr($_SERVER['HTTP_AUTHORIZATION'], 6) ));
        }
    }	

	if( !isset( $_SERVER['PHP_AUTH_USER'] ) ) {
	  header("WWW-Authenticate: Basic realm=\"Passwords\"");
	  header("HTTP/1.0 401 Unauthorized");
	  echo $s_AuthorizationFailedHTML;
	  exit();
	} 
	$status = isAuthUserAndPasswordCorrect( $_SERVER["PHP_AUTH_USER"], $_SERVER['PHP_AUTH_PW'] );
	if( !$status['authorized'] ) {
		if( !$bAjax ) {
		  header("WWW-Authenticate: Basic realm=\"Passwords\"");
		  header("HTTP/1.0 401 Unauthorized");
		  echo $s_AuthorizationFailedHTML;
		} else {
			echo $s_AuthorizationFailed;
		}
		exit();
	}
	return $status['userName'];
}


function isAuthUserAndPasswordCorrect( $sUser, $sPassword ) {
	global $s_AuthUsersFile;
	global $s_AuthorizationFailed;

	$bAuthorized = false;
	$iError = 0;
	$sUserName = '';

	$sSplitter = "\t";
	$iUserPos = 0;
	$iPasswordPos = 1;
	$iUserNamePos = 2;
	
	if( file_exists( $s_AuthUsersFile ) ) {
		$fileHandle = fopen( $s_AuthUsersFile, 'rb' );
		
		if( $fileHandle != FALSE ) {
			$sEncryptedPassword = strtolower( encrypt( $sPassword ) );

			while( !feof( $fileHandle ) ) {
				$sLine = fgets( $fileHandle );
				$aExploded = explode( $sSplitter, $sLine );
				if( count( $aExploded ) < 3 ) {
					continue;
				}
				if( strlen( $aExploded[ $iUserPos ] ) < 1 ) {
					continue;
				}
				
				$sTryUser = $aExploded[ $iUserPos ];				
				if( strlen($sTryUser) != strlen($sUser) ) {
					continue;
				}
				if( strncmp( $sTryUser, $sUser, strlen($sTryUser) ) != 0 ) {
					continue;
				}

				$sTryPassword = strtolower( $aExploded[ $iPasswordPos ] );
				if( strlen($sTryPassword) != strlen($sEncryptedPassword) ) {
					continue;
				}
				if( strncmp( $sEncryptedPassword, $sTryPassword, strlen($sTryPassword) ) != 0 ) {
					continue;
				}
				
				$sUserName = $aExploded[ $iUserNamePos ];
				$sUserName = trim( $sUserName, "\r\n" );
				$bAuthorized = true;
				break;
			}
			fclose( $fileHandle );
		} else {
			$iError = 1;
		}
	} else {
		$iError = 1;
	}
	return array( 'authorized' => $bAuthorized, 'error' => $iError, 'userName' => $sUserName );
}


function encrypt( $s ) {
	$encrypted = '';
	for( $i = 0 ; $i < strlen( $s ) ; $i++ ) {
	   $byteValue = ord( $s[$i] );
	   $xor = $byteValue ^ 0xFF;
	   $encrypted = $encrypted . dechex( $xor );
	}
	return $encrypted;
}


function getFileModTime( $fileName ) {
	$time = filemtime($fileName);	
	return $time;
	// echo "Last modified: ".date("F d Y H:i:s.",$time);
}

?>