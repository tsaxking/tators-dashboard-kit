<script lang="ts">
	import { Permissions } from "$lib/model/permissions";
	import { onMount } from "svelte";
    import { Account } from "$lib/model/account";
	import { DataArr } from "drizzle-struct/front-end";

    interface Props {
        role: Permissions.RoleData;
    }

    const { role }: Props = $props();

    let users = $state(new DataArr(Account.Account, []));

    onMount(() => {
        users = Permissions.usersFromRole(role);
    });
</script>