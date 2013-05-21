site = {

    //  the homepage of the site
    home: function(request, response){

        var templateValues = {
            msg: 'Everything is ok'
        };

        response.render('index', templateValues);

    }


};
