<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

class geopoppy_sql {

    protected $actions = array(
        'test_central_connection' => array(
            'sql' => '
                SELECT * FROM central_lizsync.server_metadata
            ',
            'message' => ''
        ),
        'synchronize' => array(
            'sql' => '
                SELECT * FROM lizsync.synchronize()
            ',
            'message' => ''
        )
        // Add parameters, FROM geopoppy.calcul_num_adr(ST_geomfromtext($1,$2))
    );

    function __construct() {
        $this->actions['test_central_connection']['message'] = jLocale::get('geopoppy~geopoppy.action.connection.ok');
        $this->actions['synchronize']['message'] = jLocale::get('geopoppy~geopoppy.action.synchronization.ok');
    }

    protected function getSql($action) {
        if (isset($this->actions[$action]) and !empty($this->actions[$action]['sql']) ) {
            return $this->actions[$action]['sql'];
        }
        return Null;
    }

    protected function getMessage($action, $data) {

        $message = array();
        if (isset($this->actions[$action]) and !empty($this->actions[$action]['message']) ) {
            $message['title'] = $this->actions[$action]['message'];
            // synchronization
            $description = '';
            if ($action == 'synchronize') {
                foreach($data as $line){
                    $description.= '<b>'.jLocale::get('geopoppy~geopoppy.result.server.to.clone').'</b>: ';
                    $description.= $line->number_replayed_to_central.'</br>';
                    $description.= '<b>'.jLocale::get('geopoppy~geopoppy.result.clone.to.server').'</b>: ';
                    $description.= $line->number_replayed_to_clone.'</br>';
                    $description.= '<b>'.jLocale::get('geopoppy~geopoppy.result.conflicts.resolved').'</b>: ';
                    $description.= $line->number_conflicts.'</br>';
                }
            } else {
                foreach($data as $line){
                    foreach($line as $k=>$v){
                        $description.= '<b>'.$k.'</b>: '.$v.'</br>';
                    }
                }
            }
            $message['description'] = $description;
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

    function start($repository, $project, $token, $action) {

        $profile = $this->getDatasourceProfile($repository, $project);
        $this->repository = $repository;
        $this->project = $project;

        // Get SQL query for action
        $sql = $this->getSql($action);
        if(!$sql){
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>jLocale::get('geopoppy~geopoppy.error.action.unknown.title'),
                    'description'=>''
                ),
                'data'=> array()
            );
        }

        // Get connection to local database
        try {
            $cnx = jDb::getConnection( $profile );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>jLocale::get('geopoppy~geopoppy.error.connection.error.title'),
                    'description'=>jLocale::get('geopoppy~geopoppy.error.connection.error.description')
                ),
                'data'=> array()
            );
        }

        // Prepare query (prepared statement)
        try {
            $resultset = $cnx->prepare( $sql );
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>jLocale::get('geopoppy~geopoppy.error.connection.sql.title'),
                    'description'=> $e->getMessage()
                ),
                'data'=> array()
            );
        }

        // Execute query (prepared statement)
        $resultset->execute();
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>jLocale::get('geopoppy~geopoppy.error.connection.sql.title'),
                    'description'=> $errorInfo[1]
                ),
                'data'=> array()
            );
        }

        // Get notices
        //$last_notice = pg_last_notice($cnx, PGSQL_NOTICE_ALL);
        //jLog::log(json_encode($last_notice));

        // Get returned data
        $data = $resultset->fetchAll();
        $errorInfo = $cnx->errorInfo();
        if($errorInfo and !empty($errorInfo[1])) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>jLocale::get('geopoppy~geopoppy.error.connection.sql.title'),
                    'description'=> $errorInfo[1]
                ),
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
