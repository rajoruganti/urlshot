module.exports = function(){
    switch(process.env.NODE_ENV){
        case 'development':
            return {"host":"127.0.0.1:8080"};

        case 'production':
            return {"host":"urlshot.toyroute.com"};

        default:
            return {"host":"127.0.0.1:8080"};
    }
};
