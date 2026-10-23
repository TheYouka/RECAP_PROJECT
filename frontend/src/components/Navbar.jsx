

function Navbar(){

    return (
        <nav className="navbar">
            <p> RECAP</p>

            <form className="search-form" role="search">
                <input 
                    type="search" 
                    name="q" 
                    placeholder="Buscar..." 
                    className="search-input"
                    aria-label="Buscar en el sitio"
                />
            </form>

            

        </nav>
    )

}

export default Navbar;