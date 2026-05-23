<script>
    // @ts-nocheck
    import "./admin.css";
    import { fetchPost, fetchGet } from "../../utils/fetchUtil.js"; // Husk at vi også skal bruge fetchGet
    import toast from "svelte-french-toast";
    import { currentUser } from "../../stores/userStore";
    import { useNavigate } from "svelte-navigator";
    import { onMount } from "svelte";

    const navigate = useNavigate();

    let claims = [];
    let selectedClaimId = null;
    let compensationAmount = 0;

    onMount(async () => {
        await loadClaims();
    });

    async function loadClaims() {
        try {
            const result = await fetchGet("/api/admin/insurance-claims");
            if (result && result.data) {
                claims = result.data;
            }
        } catch (error) {
            toast.error("Kunne ikke hente forsikringskrav.");
        }
    }

    async function handleClaimStatus(id, status) {
        const bodyData = { status };

        if (status === "approved") {
            bodyData.decidedCompensation = Number(compensationAmount);
        }

        try {
            // Vi laver et PATCH kald via den almindelige fetch (eller vores nye util)
            const response = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/admin/insurance-claims/${id}`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(bodyData),
                },
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.errorMessage);
            }

            toast.success(
                `Kravet blev ${status === "approved" ? "godkendt" : "afvist"}!`,
            );
            selectedClaimId = null;
            compensationAmount = 0;
            await loadClaims(); // Opdater tabellen reaktivt
        } catch (error) {
            toast.error(error.message || "Noget gik galt under behandlingen.");
        }
    }

    async function handleLogout() {
        try {
            await fetchPost("/auth/logout", {});
            $currentUser = null;
            toast.success("Logout successful! Come back soon!");
            navigate("/");
        } catch (error) {
            toast.error("Something went wrong...");
        }
    }
</script>

<div class="admin-container">
    <header>
        <h2>Welcome administrator {$currentUser?.email}</h2>
        <button on:click={handleLogout}>Log out</button>
    </header>

    <hr />

    <h3>Ubehandlede og historiske forsikringskrav</h3>

    <div class="table-container">
        {#if claims.length === 0}
            <p>Der er i øjeblikket ingen forsikringskrav i systemet.</p>
        {:else}
            <table>
                <thead>
                    <tr>
                        <th>Opgave Titel</th>
                        <th>Kunde</th>
                        <th>Beskrivelse</th>
                        <th>Oprettet</th>
                        <th>Status</th>
                        <th>Handling</th>
                    </tr>
                </thead>
                <tbody>
                    {#each claims as claim}
                        <tr class={claim.status}>
                            <td
                                ><strong>{claim.task_title}</strong>
                                <br /><small>Task ID: {claim.task_id}</small
                                ></td
                            >
                            <td
                                >{claim.customer_name} <br /><small
                                    >{claim.customer_email}</small
                                ></td
                            >
                            <td class="desc-cell">{claim.description}</td>
                            <td
                                >{new Date(
                                    claim.creation_date,
                                ).toLocaleDateString("da-DK")}</td
                            >
                            <td
                                ><span class="badge {claim.status}"
                                    >{claim.status}</span
                                ></td
                            >
                            <td>
                                {#if claim.status === "pending"}
                                    <button
                                        class="action-btn"
                                        on:click={() =>
                                            (selectedClaimId = claim.id)}
                                        >Behandl</button
                                    >
                                {:else}
                                    <small
                                        >Behandlet d. {new Date(
                                            claim.handled_date,
                                        ).toLocaleDateString("da-DK")}</small
                                    >
                                    {#if claim.decided_compensation}
                                        <br /><strong class="money"
                                            >{claim.decided_compensation} kr.</strong
                                        >
                                    {/if}
                                {/if}
                            </td>
                        </tr>

                        {#if selectedClaimId === claim.id}
                            <tr>
                                <td colspan="6" class="management-panel">
                                    <h4>
                                        Behandl krav for opgave: "{claim.task_title}"
                                    </h4>

                                    <div class="form-group">
                                        <label for="comp"
                                            >Kompensation ved godkendelse (kr.):</label
                                        >
                                        <input
                                            id="comp"
                                            type="number"
                                            bind:value={compensationAmount}
                                            min="0"
                                            placeholder="F.eks. 2500"
                                        />
                                    </div>

                                    <div class="decision-buttons">
                                        <button
                                            class="approve"
                                            on:click={() =>
                                                handleClaimStatus(
                                                    claim.id,
                                                    "approved",
                                                )}>Godkend</button
                                        >
                                        <button
                                            class="deny"
                                            on:click={() =>
                                                handleClaimStatus(
                                                    claim.id,
                                                    "denied",
                                                )}>Afvis</button
                                        >
                                        <button
                                            class="cancel"
                                            on:click={() =>
                                                (selectedClaimId = null)}
                                            >Annuller</button
                                        >
                                    </div>
                                </td>
                            </tr>
                        {/if}
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</div>
