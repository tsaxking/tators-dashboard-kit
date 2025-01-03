<script lang="ts">
    import { Test } from "$lib/model/testing.svelte.ts";
	import { toSnakeCase } from "ts-utils/text";

    const tests = Test.unitTest();

    // let progress = $state(0);

    // setInterval(() => {
    //     progress += 
    // }, 500);

    const generateSymbol = (state: Test.State): string => {
        switch (state) {
            case 'not started':
                return 'pending_actions';
            case 'in progress':
                return 'pending';
            case 'success':
                return 'new_releases';
            case 'failure':
                return 'error_outline';
        }
    }
</script>


{#snippet test(name: string, state: Test.State)}
    <li class="list-group-item"
        id="test-{toSnakeCase(name)}"
        data-value={state}
    >
        <i 
        class="
        material-icons 
        animate__bounce 
        animate__infinite
    "
        class:text-success={state === 'success'}
        class:text-danger={state === 'failure'}
        class:text-warning={state === 'in progress'}
        class:animate__animated={state === 'in progress'}
    >
            {@html generateSymbol(state)}
        </i>
        {name}
    </li>

{/snippet}

<ul class="list-group">
    {@render test('Connected', tests.connect)}
    {@render test('Created new', tests.new)}
    {@render test('Update', tests.update)}
    {@render test('Archive', tests.archive)}
    {@render test('Restore Archive', tests.restore)}
    {@render test('Delete', tests.delete)}
    {@render test('Read Version', tests.readVersion)}
    {@render test('Delete Version', tests.deleteVersion)}
    {@render test('Read All', tests.readAll)}
    {@render test('Read Archived', tests.readArchived)}
    {@render test('Read From Property', tests.readFromProperty)}
    {@render test('Emit New', tests.emitNew)}
    {@render test('Emit Update', tests.emitUpdate)}
    {@render test('Emit Archive', tests.emitArchive)}
    {@render test('Emit Restore', tests.emitRestore)}
    {@render test('Emit Delete', tests.emitDelete)}
</ul>
