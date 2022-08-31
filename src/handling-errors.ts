export default class HandlingErrors {
    
    axios(error) {
        console.log("Error axios ----------------");
        
        if (error.response) {
            console.log("-----------------------response---------------------");
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
            console.log("-----------------------response---------------------");
        } else if (error.request) {
            console.log("-----------------------request---------------------");
            console.log(error.request);
            console.log("-----------------------request---------------------");
        } else {
            console.log("-----------------------else---------------------");
            console.log('Error', error.message);
        }
        
        console.log("-----------------------config---------------------");
        console.log(error.config);
    }
}