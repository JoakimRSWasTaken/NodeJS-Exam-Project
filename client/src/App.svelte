<script>
    // @ts-nocheck
    import toast, { Toaster } from "svelte-french-toast";
    import Login from "./pages/Login/Login.svelte";
    // import User from "./pages/User/User.svelte";
    import Admin from "./pages/Admin/Admin.svelte";
    // @ts-ignore
    import { Router, Route } from "svelte-navigator";
    import { currentUser } from "./stores/userStore";
</script>

<Toaster />

<Router>
    <Route path="/"><Login /></Route>

    {#if $currentUser}
        <!-- <Route path="/user"><User /></Route> -->

        {#if $currentUser.isAdmin === 1}
            <Route path="/admin"><Admin /></Route>
        {/if}
    {/if}
</Router>
