<?php

	header("Content-type: application/json");
	header("Cache-Control: no-cache, no-store, must-revalidate");
	echo json_encode(array('a' => 'some data'));
