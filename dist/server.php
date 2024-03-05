<?php 

//error_reporting(E_ALL);
//ini_set('display_errors', 1);

//require('auth.php');

//if( isAuthRequired() ) {
//	auth(true);
//}

define( "AUTH_SCRIPT", "<?php require('auth.php'); if( isAuthRequired() ) { auth(true); } ?>" );

define( "LINE_NUMBER_KEY", "f_WebExportLineNumber");
define( "PARENT_OPERATION_KEY", "OperCode" );

define( "DATA_FILE", "data.php" );
define( "USER_DATA_FILE", "user_data.csv.php" );
define( "TEMP_USER_DATA_FILE", "user_data.temp" );

define( "LOCK_FILE", "status.ini");
define( "IS_SYNCHRONIZED_FILE", "download.ini");

if( isset( $_GET['action'] ) ) {
	if( $_GET['action'] == 'store_user_data' ) {
		store();
	} elseif( $_GET['action'] == 'check_synchronization' ) {
    	is_synchronized();
	} elseif( $_GET['action'] == 'lock' ) { 
    	manage_lock(1);
	} elseif( $_GET['action'] == 'unlock' ) { 
    	manage_lock(0);
	} elseif( $_GET['action'] == 'check_lock' ) { 
    	manage_lock(-1);
	} elseif( $_GET['action'] == 'logout' ) {
    	logout();
	}
}
exit(0);

function logout() {
    header("HTTP/1.0 401 Unauthorized");
    echo "<script>window.location.replace('http://www.spiderproject.pro/');</script>";
}

function manage_lock( $locked ) {
    $returnStr = '{'; // The JSON-string To be returned to http client... 
    
    if( $locked == 0 || $locked == 1 ) { 			// If a status must be set...
        $fileHandle = fopen( LOCK_FILE, 'w' ); 		// ... opening "status.ini" file
        if( $fileHandle != FALSE ) { 				// ... if succeeded... 
            $status = fwrite( $fileHandle, '[Data]'. PHP_EOL . 'locked=' . $locked ); 		// ...writing "locked" status...
            if( $status != FALSE ) {										// ... if succeeded...
                   $returnStr .= '"locked":' . $locked;						//
            } else {
                   $returnStr .= '"locked":0, "error":"File write error"';
            }			
            fclose( $fileHandle );
        } else { 														// ... if failed to write into "status.ini" file... 
               $returnStr .= '"locked":0, "error":"File open error"';
        } 
    } else { 												// If not writing but only reading locked/unlocked status... 
        $fileHandle = fopen( LOCK_FILE, 'r' ); 				// .. opening "status.ini" file...
        if( $fileHandle != FALSE ) {						// ... if succeeded ...
            $found = false;
            while( !feof( $fileHandle ) ) {					// ... searching for and reading the "locked" line
                $line = fgets( $fileHandle );
                $explodedLine = explode( '=', $line );
                if( strtolower( $explodedLine[0] ) == 'locked' ) {
                       $returnStr .= '"locked":' . $explodedLine[1];
                    $found = true;
                    break;
                }
            }
            if( !$found ) {									// ... if not found...
                   $returnStr .= '"locked":0';				// ... setting to "unlocked"
            }
            fclose( $fileHandle );					
        } else {													// If failed to open "status.ini" file...
            $fileHandle = fopen( LOCK_FILE, 'w' ); 				// ... creating the one...
            if( $fileHandle != FALSE ) {							// ... if succeeded...
                $status = fwrite( $fileHandle, '[Data]'. PHP_EOL . 'locked=0' );	 	// ... writing "unlocked" status...
                if( $status != FALSE ) {							// ... if succeeded...
                       $returnStr .= '"locked":0';						// ...setting "unlocked" status
                } else {											// . otherwise											
                       $returnStr .= '"locked":0, "error":"File write error"'; // ... adding "error" status
                }
                fclose($fileHandle);
            } else {														// If failed to open "status.ini" for writing...
                   $returnStr .= '"locked":0, "error":"File open error"'; 		// ... reporting "unlocked" and "error" status
            }
        }
    }	
    $returnStr .= ', "ganttmtime":' . filemtime(DATA_FILE); 		// Adding data modification time. 
    $returnStr .= '}';
    
    echo($returnStr); 		// Sending data to client via http.    
}


function is_synchronized() {
    $returnStr = '{"synchronized":1}';
    $fileHandle = fopen( IS_SYNCHRONIZED_FILE, 'r' ); 			// .. opening "download.ini" file...
    if( $fileHandle != FALSE ) {						// ... if succeeded ...
        while( !feof( $fileHandle ) ) {					// ... searching for and reading the "download.ini" line
            $line = fgets( $fileHandle );
            $explodedLine = explode( '=', $line );
            if( strtolower( $explodedLine[0] ) == 'loaded' ) {
                if( strlen( $explodedLine[1] ) > 0 ) {
                    $loaded = (int)$explodedLine[1];
                    $returnStr = '{"synchronized":' . $loaded . '}';
                }
                break;
            }
        }
        fclose( $fileHandle );					
    }
    echo($returnStr); 		// Sending data to client via http.        
}


function store() {
    $errorCode = storeData();

    // Creating the response, holding statuses of operations 
    $_response = "{\"errorCode\":" . $errorCode . "}";
    echo( $_response );

    if( $errorCode == 0 ) { 	// Updating download status file to indicate user entered data that hasn't been transfered into Spider yet...
        $fileHandle = fopen( IS_SYNCHRONIZED_FILE, 'w' ); 			// .. opening "download.ini" file...
        if( $fileHandle != FALSE ) {							// ... if succeeded ...
            fwrite( $fileHandle, "loaded=0" );  
            fclose( $fileHandle );					
        }
    }
}


// Stores a line and uploads/deletes the file(s) if required
function storeLine($handle, $code, $lnumber, $parent, $data) {
	$line = $code . "\t" . $lnumber . "\t" . $parent;
	foreach( $data as $key => $value ) {
		$line .= "\t";
		$line .= $value;
	}

	$line = preg_replace('/[\r\n]/', chr(1), $line);
	$line = preg_replace('/[\n]/', chr(1), $line);
	$line = preg_replace('/[\r]/', chr(1), $line);
	if( fputs($handle, $line . "\n") == FALSE ) {
		return 1;
	}
	return 0;
}


// Creates a new "user-data" file and saves data into
function storeNew( $code, $lnumber, $parent, $data) {
	$errorCode = 1;

	$handle = fopen( USER_DATA_FILE, 'w' );
	if( $handle ) {
		$status = fputs( $handle, AUTH_SCRIPT  . "\n" ); 	// "Auth" script for security

		$columnTitles = "Code\t" . LINE_NUMBER_KEY . "\t" . PARENT_OPERATION_KEY; // The header: Code f_WebExportLineNumber ... f_File			
		foreach( $data as $key => $value ) {
			$columnTitles .= "\t";
			$columnTitles .= $key;
		}
		fputs( $handle, $columnTitles . "\n" );  

		$errorCode = storeLine( $handle, $code, $lnumber, $parent, $data );		// A new and the only line
		fclose( $handle );
	}
	return $errorCode;
}


// Inserts new data into the existing user-data file
function storeWithInsertion( $code, $lnumber, $parent, $data ) {
	$errorCode = 1;

	$srcHandle = fopen( USER_DATA_FILE, 'r' ); 			// .. opening "user data" file file...
	$dstHandle = fopen( TEMP_USER_DATA_FILE, 'w' ); 			// .. opening "temp" file file...
	
	$counter = 0;
	if( $srcHandle != FALSE && $dstHandle != FALSE ) {		// ... if succeeded ...
		$inserted = FALSE;
		while( !feof( $srcHandle ) ) {						// To let us know if the operation has already been stored or not...
			$counter += 1;

			$line = fgets( $srcHandle );
			if( $counter <= 2 ) {
				fputs( $dstHandle, $line );
				continue; 
			}

			$explodedLine = explode( "\t", $line );

			if( $explodedLine[0] == $code && $explodedLine[1] == $lnumber ) {
				$errorCode = storeLine( $dstHandle, $code, $lnumber, $parent, $data );
				$inserted = TRUE;
			} else {
				fputs( $dstHandle, $line );
			}
		}
		if( !$inserted ) {
			$errorCode = storeLine( $dstHandle, $code, $lnumber, $parent, $data );
		}
	} 
	if( $dstHandle != FALSE ) { 
		fclose( $dstHandle );					
	}
	if( $srcHandle != FALSE ) { 
		fclose( $srcHandle );					
	}

	if( $errorCode == 0 ) {
		if( rename( TEMP_USER_DATA_FILE, USER_DATA_FILE ) == FALSE ) {
			$errorCode = 1;
		}
	}
	return $errorCode;
}


function storeData() {
	$errorCode = 1;

	// Check if the form was submitted
	if($_SERVER["REQUEST_METHOD"] != "POST") {
		return $errorCode;
	}
	if( !isset( $_POST['data'] ) ) {
		return $errorCode;
	}

	$json = json_decode( stripslashes($_POST['data']) );

	if( !isset( $json->operationCode ) || !isset( $json->lineNumber ) || !isset( $json->parentOperation ) || !isset( $json->data ) ) {	
		return $errorCode;
	}

	if( !file_exists( USER_DATA_FILE ) ) {
		$errorCode = storeNew( $json->operationCode, $json->lineNumber, $json->parentOperation, $json->data );
	} else {
		$errorCode = storeWithInsertion( $json->operationCode, $json->lineNumber, $json->parentOperation, $json->data );
	}

	return $errorCode;
}


function logTxt( $txt ) {
	$fp = fopen('log.txt', 'a' );
	fputs( $fp, $txt . "\n" );
	fclose($fp);
}

?>