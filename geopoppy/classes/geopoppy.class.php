<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

class geopoppy {

    protected $actions = array(
        'test_central_connection' => array(
            'sql' => '
                SELECT * FROM central_lizsync.server_metadata
            ',
            'message' => 'Central database connection OK'
        ),
        'synchronize' => array(
            'sql' => '
                SELECT * FROM lizsync.synchronize()
            ',
            'message' => 'Synchronization OK'
        )
        // Add parameters, FROM geopoppy.calcul_num_adr(ST_geomfromtext($1,$2))
    );

//SELECT * FROM lizsync.synchronize()

    protected function getSql($action) {
        if (isset($this->actions[$action]) and !empty($this->actions[$action]['sql']) ) {
            return $this->actions[$action]['sql'];
        }
        return Null;
    }

    protected function getMessage($action, $data) {

        if (isset($this->actions[$action]) and !empty($this->actions[$action]['message']) ) {
            $message = $this->actions[$action]['message'];
            // synchronization
            if ($action == 'synchronize') {
                foreach($data as $line){
                    $message.= '</br>Number of modifications applied from the central server ';
                    $message.= $line->number_replayed_to_central;
                    $message.= '</br>Number of modifications applied to the central server ';
                    $message.= $line->number_replayed_to_clone;
                    $message.= '</br>Number of conflicts resolved during the synchronization ';
                    $message.= $line->number_conflicts;
                }
            }
            return $message;
        }
        return Null;
    }

    /**
    * Get the Name of the DB profile
    * @param project Project key
    * @param repository Repository key
    * @param layerName Name of the Parcelle layer
    * @param profile The default geopoppy DB profile
    * @return Name of the geopoppy DB profile
    */
    protected function getDatasourceProfile($repository, $project) {
        $p = lizmap::getProject($repository.'~'.$project);
        $profile = 'geopoppy';
        return $profile;
    }

    function getData($repository, $project, $action, $options) {

        $profile = $this->getDatasourceProfile($repository, $project);
        $this->repository = $repository;
        $this->project = $project;

        // Get SQL query for action
        $sql = $this->getSql($action);
        if(!$sql){
            return array(
                'status'=>'error',
                'message'=>'The given action does not exists in this module',
                'data'=> array()
            );
        }

        // Get connection to local database
        try {
            $cnx = jDb::getConnection( $profile );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=>'Cannot connect to local geopoppy database',
                'data'=> array()
            );
        }

        // Prepare query (prepared statement)
        try {
            $resultset = $cnx->prepare( $sql );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=>'SQL error :' . $e->getMessage(),
                'data'=> array()
            );
        }

        // Execute query (prepared statement)
        $resultset->execute( $options );
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> $errorInfo[1],
                'data'=> array()
            );
        }

        // Get returned data
        $data = $resultset->fetchAll();
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> $errorInfo[1],
                'data'=> array()
            );
        }

        // Data has been fetched
        $message = $this->getMessage($action, $data);
        $rdata = array(
            'status'=>'success',
            'message'=>$message,
            'data'=> $data
        );
        return $rdata;

    }
}
?>
