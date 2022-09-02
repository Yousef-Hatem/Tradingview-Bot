export default class HandlingErrors {
    
    axios(error: any) {
        const errors: string[] = ["Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content and reply markup of the message"];
        
        if (error.response) {
            if (error.response.status == 404 || errors.indexOf(error.response.data.description) == -1) {
                return;
            }
            console.log("-----------Error------axios------response---------------------");
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        } else if (error.request) {
            console.log("-----------------------request---------------------");
            console.log(error.request);
            console.log("-----------------------config---------------------");
            console.log(error.config);
        } else {
            console.log("-----------------------else---------------------");
            console.log('Error', error.message);
        }
        
    }
}