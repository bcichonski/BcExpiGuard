import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router"

function Restricted({component : Component, ...rest}) {
    const { isAuthenticated } = useAuth0();

    if(isAuthenticated) {
        return (
            <Component {...rest}/>
        )
    } else {
        return (<Navigate to="/welcome" replace />);
    }
}

export default Restricted;
