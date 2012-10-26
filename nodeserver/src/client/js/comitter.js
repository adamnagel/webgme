/*
IF:
selectBranch
updateBranch
commit

functions needed from user:
rootupdated

 */
define(['commonUtil',"core/lib/sha1"],
    function(commonUtil,SHA1){
        var Comitter = function(storage){
            var BID = "*";
            var actualbranchinfo = null;
            var currentbranchname = null;
            var currentupdfunc = null;

            var getBranches = function(callback){
                storage.find({type:"branch"},function(err,nodes){
                    if(err){
                        callback(err);
                    } else {
                        if(nodes && nodes.length>0){
                            var branches = [];
                            for(var i=0;i<nodes.length;i++){
                                branches.push(nodes[i].name);
                            }
                            callback(null,branches);
                        } else {
                            callback("no branches were found");
                        }
                    }
                });
            };

            var poll = function(node){
                if(currentupdfunc){
                    storage.requestPoll(BID+currentbranchname,poll);
                    actualbranchinfo = node;
                    currentupdfunc(node.root);
                }
            };

            var selectBranch = function(branchname,updfunc){
                currentbranchname = branchname;
                if(updfunc){
                    currentupdfunc = updfunc;
                }
                storage.requestPoll(BID+branchname,poll);
                storage.load(BID+branchname,function(err,node){
                    if(!err && node){
                        actualbranchinfo = node;
                        if(currentupdfunc){
                            currentupdfunc(node.root);
                        }
                    }
                });
            };

            var updateRoot = function(rootkey,callback){
                if(actualbranchinfo){
                    var myroot = JSON.parse(JSON.stringify(actualbranchinfo));
                    myroot.oldroot = myroot.root;
                    myroot.root = rootkey;
                    storage.save(myroot,function(err){
                        if(err){
                            callback(err);
                        } else {
                            actualbranchinfo = myroot;
                            callback(null);
                        }
                    });
                } else {
                    callback("no branch is used");
                }
            };

            var commit = function(callback){
                var mycommit = JSON.parse(JSON.stringify(actualbranchinfo));
                var branchname = mycommit['_id'];
                mycommit['_id'] = false;
                mycommit.type = 'commit';
                mycommit.end = commonUtil.timestamp();
                delete mycommit.oldroot;
                var key = '#' + SHA1(JSON.stringify(mycommit));
                mycommit['_id'] = key;
                storage.save(mycommit,function(err){
                    if(err){
                        callback(err);
                    } else {
                        var newbranchhead = {
                            _id     : branchname,
                            root    : mycommit.root,
                            oldroot : mycommit.root,
                            parents : [key],
                            updates : [],
                            start   : commonUtil.timestamp(),
                            end     : null,
                            message : "",
                            name    : mycommit.name,
                            type    : "branch"
                        };
                        storage.save(newbranchhead,function(err){
                            if(err){
                                callback(err);
                            } else {
                                actualbranchinfo = newbranchhead;
                                callback(null);
                            }
                        });
                    }
                });
            };

            var getCommits = function(callback){
                storage.find({type:"commit"},function(err,nodes){
                    if(err){
                        callback(err);
                    } else {
                        if(nodes && nodes.length>0){
                            var branches = [];
                            for(var i=0;i<nodes.length;i++){
                                branches.push(nodes[i]['_id']);
                            }
                            callback(null,branches);
                        } else {
                            callback("no branches were found");
                        }
                    }
                });
            };

            var loadCommit = function(commitkey){
                storage.load(commitkey,function(err,commit){
                    if(err){
                        /*TODO - na itt mi van*/

                    } else {

                        var newbranchhead = {
                            _id     : BID+commit.name,
                            root    : commit.root,
                            oldroot : commit.root,
                            parents : ["#"+commitkey],
                            updates : [],
                            start   : commonUtil.timestamp(),
                            end     : null,
                            message : "",
                            name    : commit.name,
                            type    : "branch"
                        };

                        actualbranchinfo = newbranchhead;
                        if(currentupdfunc){
                            currentupdfunc(commit.root);
                        }
                    }
                });
            };

            return {
                selectBranch           : selectBranch,
                updateRoot             : updateRoot,
                commit                 : commit,
                getBranches            : getBranches,
                getCommits             : getCommits,
                loadCommit             : loadCommit,
                requestPoll            : storage.requestPoll
            }
        };

        return Comitter;
    });
