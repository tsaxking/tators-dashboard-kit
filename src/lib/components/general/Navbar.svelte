<script lang="ts">
    import SideNav from "./SideNav.svelte";
    import Notifications from "./Notifications.svelte";
	interface Props {
		title: string;
	}

	const { title }: Props = $props();

    let notifs = $state(0);
</script>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="d-flex">
        <button class="navbar-toggler mx-3" type="button" data-bs-toggle="offcanvas" data-bs-target="#pages" aria-controls="pages">
            <span class="navbar-toggler-icon"></span>
        </button>
		<a class="navbar-brand" href="/home">{title}</a>
    </div>
		<!-- <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page" href="#">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Features</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Pricing</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link disabled" aria-disabled="true">Disabled</a>
                </li>
            </ul>
        </div> -->
    <button class="me-5 btn btn-primary position-relative" type="button" data-bs-toggle="offcanvas" data-bs-target="#notifications" aria-controls="notifications">
        <!-- <span class="navbar-toggler-icon"></span> -->
        <i class="material-icons">
            notifications
        </i>
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {notifs}
        <span class="visually-hidden">unread messages</span>
        </span>
    </button>
</nav>


<SideNav id="pages" sections={[
    {
        name: 'Home',
        links: [
            {
                name: 'Home',
                href: '/',
                icon: 'home',
                type: 'material-icons'
            }
        ]
    }
]} />



<Notifications bind:notifs={notifs} />