<?php
/**
* @package   lizmap
* @subpackage geopoppy
* @author    Michaël DOUCHIN
* @copyright 2020 3liz
* @link      http://3liz.com
* @license    Mozilla Public Licence
*/

class geopoppy_ftp {

    private $repository = '';
    private $project = '';
    private $token = '';
    private $ftp_params = array();

    protected $actions = array(
        'ftp_synchronize' => array(
            'subdirectory' => 'media/upload',
            'excludedirs' => '',
            'direction' => 'to'
        )
    );

    private function getFtpConnectionParams($action) {
        $ftphost = '192.168.1.23';
        $ftpport = 21;
        $ftpuser = 'geopoppy';
        $ftppass = 'geopoppy';

        $ftp_params = array();

        // Lizmap project and repository paths
        $p = lizmap::getProject($this->repository.'~'.$this->project);
        $r = $p->getRepository();
        $r_path = $r->getPath();

        $localdir = realpath($r_path . $this->actions[$action]['subdirectory']);

        $ftp_params['host'] = $ftphost;
        $ftp_params['port'] = $ftpport;
        $ftp_params['user'] = $ftpuser;
        $ftp_params['password'] = $ftppass;
        $ftp_params['repository_path'] = $r_path;
        $ftp_params['localdir'] = $localdir;

        $this->ftp_params = $ftp_params;

        return $ftp_params;
    }

    protected function getFtpCommand($action) {

        $action_params =  $this->actions[$action];
        $ftp_params = $this->ftp_params;

        // Get parameters
        $localdir = $ftp_params['localdir'];
        $ftpdir = '/' . end(
            explode(
                '/',
                trim($ftp_params['repository_path'], '/')
            )
        );
        $ftpdir.= '/' . $action_params['subdirectory'];
        $direction = $action_params['direction'];
        $excludedirs = $action_params['excludedirs'];

        // Build command
        $cmd = array();
        array_push($cmd, 'lftp');
        $pass_str = '';
        if (!empty($ftp_params['password'])) {
            $pass_str = sprintf(':%s', $ftp_params['password']);
        }
        array_push($cmd,
            sprintf(
                'ftp://%s%s@%s:%s',
                $ftp_params['user'],
                $pass_str,
                $ftp_params['host'],
                $ftp_params['port']
            )
        );
        array_push($cmd, '-e');
        array_push($cmd, '"');
        array_push($cmd, 'set ftp:ssl-allow no; set ssl:verify-certificate no; ');
        array_push($cmd, 'mirror');
        if ($direction == 'to') {
            array_push($cmd, '-R');
        }
        array_push($cmd, '--verbose');
        array_push($cmd, '--continue');
        array_push($cmd, '--use-cache');
        # array_push($cmd, '-e') # pour supprimer tout ce qui n'est pas sur le serveur
        foreach (explode(',', $excludedirs) as $d) {
            $ed = trim(trim($d), '/') . '/';
            if ($ed != '/') {
                array_push($cmd, sprintf('-x %s', $ed));
            }
        }
        array_push($cmd, '--ignore-time');

        # LFTP NEEDS TO PUT
        # * from -> ftpdir (remote FTP server) BEFORE
        # * to (-R) -> localdir (computer) BEFORE ftpdir (remote FTP server)
        if ($direction == 'to') {
            array_push($cmd, sprintf('%s %s', $localdir, $ftpdir));
        }
        else {
            array_push($cmd, sprintf('%s %s', $ftpdir, $localdir));
        }
        array_push($cmd, '; quit"');

        return $cmd;

    }

    private function execInBackground($cmd, $token) {
        // Create temporary path and store it in session
        $logfile = jApp::tempPath($token . '.log');

        // Execute command in background
        //exec(sprintf("%s 1> %s 2>&1 &", $cmd, $logfile));
        $cmd = implode(' ', $cmd);
        $run_cmd = sprintf('%s > %s 2>&1 & echo $!', $cmd, $logfile);
        $locale='fr_FR.UTF-8';
        setlocale(LC_ALL, $locale);
        putenv('LC_ALL=' . $locale);
        exec($run_cmd, $pidArr);
        $pid = $pidArr[0];
        $_SESSION['geopoppy_ftpsync_logfile_'.$token] = $logfile;
        $_SESSION['geopoppy_ftpsync_pid_'.$token] = $pid;

        return $logfile;
    }

    function isRunning($pid){
        try{
            $result = shell_exec(sprintf("ps %d", $pid));
            if( count(preg_split("/\n/", $result)) > 2){
                return true;
            }
        }catch(Exception $e){
            jLog::log($e->getMessage());
        }
        return false;
    }

    private function check($action) {
        // Check action exists
        if (!isset($this->actions[$action]) ) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'Given action does not exists',
                    'description'=>''
                )
            );
        }

        $get = $this->getFtpConnectionParams($action);
        $localdir = $this->ftp_params['localdir'];
        if (!$localdir || !is_dir($localdir)) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'No directory to synchronize',
                    'description'=>''
                )
            );
        }

        return array(
            'status'=>'success',
            'message'=> array(
                'title'=>'FTP Ok',
                'description'=>''
            )
        );
    }

    function start($repository, $project, $token, $action) {

        $this->repository = $repository;
        $this->project = $project;
        $this->token = $token;

        // Check
        $check = $this->check($action);
        if ($check['status'] == 'error') {
            return $check;
        }

        // Build command
        $cmd = $this->getFtpCommand($action);

        // Run command
        try {
            $logfile = $this->execInBackground($cmd, $token);
        } catch (Exception $e) {
            return array(
                'status'=>'error',
                'message'=> array(
                    'title'=>'Unknown error while running the media synchronization',
                    'description'=>''
                ),
                'data'=> array()
            );
        }

        $rdata = array(
            'status'=>'progress',
            'message'=> array(
                'title' => 'Media synchronization started',
                'description' => 'Token = ' . $token
            ),
            'data'=> array('token'=>$token)
        );
        return $rdata;

    }

    function status($repository, $project, $token, $action) {

        // get needed values
        $p = lizmap::getProject($repository.'~'.$project);

        // checks
        if( !$p ){
            $data = array(
                'status'=>'error',
                'message'=> array (
                    'title' => 'A problem occured while loading project with Lizmap',
                    'description' => ''
                )
            );
            return $data;
        }

        // Check if session exists for this token
        if (!array_key_exists('geopoppy_ftpsync_logfile_'.$token, $_SESSION)) {
            $data = array(
                'status'=> 'error',
                'message' => array(
                    'title' => 'Token has expired',
                    'description' => ''
                )
            );
        } else {
            $logfile = $_SESSION['geopoppy_ftpsync_logfile_'.$token];
            $pid = $_SESSION['geopoppy_ftpsync_pid_'.$token];
            $logcontent = jFile::read($logfile);
            // Check sync is running or not
            if ($this->isRunning($pid)) {
                $data = array(
                    'status' => 'progress',
                    'message' => array(
                        'title' => 'Media synchronization in progress...',
                        'description' => $logcontent
                    ),
                    'data'=> array('token'=>$token)
                );

            } else {
                if (empty($logcontent)) {
                    $logcontent = 'Nothing to synchronize';
                }
                $data = array(
                    'status' => 'success',
                    'message' => array(
                        'title' => 'Media synchronization sucessfull !',
                        'description' => $logcontent
                    )
                );
                //unlink($logfile);
                unset($_SESSION['geopoppy_ftpsync_logfile_'.$token]);
                unset($_SESSION['geopoppy_ftpsync_pid_'.$token]);
            }

        }
        return $data;
    }

    function stop() {
        return False;
    }
}
?>
