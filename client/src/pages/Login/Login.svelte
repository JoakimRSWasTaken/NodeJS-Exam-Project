<script>
    // @ts-nocheck
    import "./login.css";
    import { fetchPost } from "../../utils/fetchUtil.js";
    import toast, { Toaster } from "svelte-french-toast";
    import { currentUser } from "../../stores/userStore.js";
    import { useNavigate } from "svelte-navigator";

    let loginMode = true;

    let loginEmail = "";
    let loginPassword = "";

    let signupEmail = "";
    let signupPassword = "";

    const navigate = useNavigate();

    function flipLoginCard() {
        loginMode = !loginMode;
    }

    async function handleAuth(event) {
        event.preventDefault();
        const email = loginMode ? loginEmail : signupEmail;
        const password = loginMode ? loginPassword : signupPassword;
        const endpoint = loginMode ? "/auth/login" : "/auth/signup";

        try {
            const result = await fetchPost(endpoint, { email, password });
            console.log("Result: ", result);
            if (!loginMode) {
                // If you just signed up you get sent to the login page
                toast.success("You have just signed up! Check your email!", {
                    position: "top-right",
                });
                flipLoginCard();
                signupEmail = "";
                signupPassword = "";
            } else {
                // If you were in login mode, you log in
                toast.success("Successfully logged in!", {
                    position: "top-right",
                });

                const responseUser = result.user;

                currentUser.set(result.user); // Saving user in the store ^^

                if (result.user.isAdmin === 1) {
                    navigate("/admin");
                } else {
                    navigate("/user");
                }
            }
        } catch (error) {
            // If the fetchPost throws an error we catch it here
            console.log(error);
            toast.error("Something went wrong...", {
                position: "top-right",
            });
        }
    }
</script>

<div class="card-container">
    <div class="card {loginMode ? 'login' : 'signup'}">
        <div class="login-card">
            <h2>Login</h2>
            <form on:submit={handleAuth}>
                <fieldset>
                    <input
                        bind:value={loginEmail}
                        name="email"
                        type="email"
                        required
                        placeholder="Email address"
                    />
                    <br />
                    <input
                        bind:value={loginPassword}
                        name="password"
                        type="password"
                        required
                        placeholder="Password"
                    />
                    <br />
                </fieldset>
                <button type="submit">Login</button>
            </form>
            <p>Don't have a profile?</p>
            <button on:click={flipLoginCard}>Make one here!</button>
        </div>

        <div class="signup-card">
            <h2>Sign Up</h2>
            <form on:submit={handleAuth}>
                <fieldset>
                    <input
                        bind:value={signupEmail}
                        name="email"
                        type="email"
                        required
                        placeholder="Email address"
                    />
                    <br />
                    <input
                        bind:value={signupPassword}
                        name="password"
                        type="password"
                        required
                        placeholder="Password"
                    />
                    <br />
                </fieldset>
                <button type="submit">Sign Up</button>
            </form>
            <p>Already have a profile?</p>
            <button on:click={flipLoginCard}>Login here!</button>
        </div>
    </div>
</div>
