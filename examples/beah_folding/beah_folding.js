/* LVM2 LOG FILE DATA */

var hlLine = function(line, c) {
  return "<span class='"+c+"'>"+line+"</span>";
};

var hlTop = function(line) {
  // if (COND) return hlLine(hlNone(line), "class");
  return hlNone(line);
};

var beah_re = test_re(/(beah|backend|rhts_task) [^ ]+: INFO |^\]\) *$|^\[-- MARK -- .*\] *$|logger: .* \/usr\/bin\/rhts-test-runner\.sh \d+ \d+ hearbeat\.\.\. *$/);

var hlNone = function(line) {
  if (beah_re(line)) {
    return hlLine(line, "beah");
  }
  return line;
};

/*
var test_start_re = test_re(/JobID:\d+ Test:.* Response:/);
var test_end_re = test_re(/testID:\d+ finish:/);
*/

var test_start_re = test_re(/testID:\d+ start: /);
var test_end_re = test_re(/^logger: \/usr\/bin\/rhts-test-runner\.sh report_finish start\.\.\.  /);

var beah_context = function(id, element) {
  var beah_logs = {"re": beah_re, "class": "beah", "id": "", "highlight": hlNone, "collapsed": constant(1)};
  return [base_context(
  id,
  [
    // allowed: re, id, class, highlight, next. re_end

    // Fold everything until the test ends:
    {"re": test_start_re, "re_end": test_end_re, "next": [beah_logs], "id": "", "highlight": hlNone, "collapsed": constant(0)},

    {"re": test_re(/^\[[ 0-9]\d:\d\d\] .*{{{/),            "id": "_span",                                "highlight": hlTop,        "next": [], "re_end": test_re(/^\[[ 0-9]\d:\d\d\] .*}}}/), "next": [beah_logs]},

    // !!!THIS MUST BE THE LAST! IT MATCHES ANYTHING OUTSIDE OF OTHER FOLDS!!!
    // Fold everything until the test starts:
    {"re": test_re(/^/), "re_end": test_start_re, "id": "", "highlight": hlNone, "next": [beah_logs]}

  ],
  hlTop,
  element
)]; };

/*
Some interesting/important messages:

Initializing cgroup subsys cpuset 
Initializing cgroup subsys cpu 
Linux version 2.6.32-554.el6.ppc64 (mockbuild@ppc-019.build.eng.bos.redhat.com) (gcc version 4.4.7 20120313 (Red Hat 4.4.7-15) (GCC) ) #1 SMP Tue Apr 14 19:03:59 EDT 2015 

 Running anaconda 13.21.234, the Red Hat Enterprise Linux system installer - please wait. 

Starting installation process 

Running post-installation scripts 

rebooting system 
Restarting system. 

Loading ramdisk... 
ramdisk loaded at 088c0000, size: 20281 Kbytes 
OF stdout device is: /vdevice/vty@30000000 
Preparing to boot Linux version 2.6.32-554.el6.ppc64 (mockbuild@ppc-019.build.eng.bos.redhat.com) (gcc version 4.4.7 20120313 (Red Hat 4.4.7-15) (GCC) ) #1 SMP Tue Apr 14 19:03:59 EDT 2015 
Max number of cores passed to firmware: 0x0000000000000100 
Calling ibm,client-architecture-support... done 
command line: ro rd_NO_LUKS LANG=en_US.UTF-8 rd_NO_MD console=hvc0  KEYTABLE=us SYSFONT=latarcyrheb-sun16 crashkernel=auto rd_NO_LVM rd_NO_DM rhgb quiet root=UUID=45cf5e8d-1e5c-4bad-98c0-15ae30fb73ca  

Starting beah-beaker-backend: [  OK  ]   
beah-beaker-backend running as process 5158  
NetworkManager: unrecognized service  
Network is not managed by NM.  
Starting beah-fwd-backend: [  OK  ]   
beah-fwd-backend running as process 5175  
Running RHTS-Compatibility Service...  
rhts-compat: Waiting for lock.  
lockfile: Try praying, giving up on "/var/run/beah/rm.lock"  
NOTE: This process runs in foreground.  
Use 'service rhts-compat stop' from another terminal to stop it.  
It will not stop immediately but only after running tasks are processed.  
ls: cannot access /var/run/beah/rhts-compat/launchers: No such file or directory  

2015-04-17 07:07:48,717 backend linfo: INFO BackendFactory: Started to connect.  
2015-04-17 07:07:48,717 backend linfo: INFO BackendFactory: Connection failed. Reason: [Failure instance: Traceback (failure with no frames): <class 'twisted.internet.error.ConnectError'>: An error occurred while connecting: 2: No such file or directory.  

04/17/15 07:08:09  JobID:933341 Test:/distribution/install Response:1  

04/17/15 07:08:09  testID:29878871 start:  

04/17/15 07:08:17  testID:29878871 finish:  

SysRq : Trigger a crash 
*/
