import { Client } from 'pg'
import { Table } from './table'
import { z } from 'zod'


export const getOldTables = (DB: Client) => {
    return {
     Accounts: new Table(
        'accounts',
        z.object({
            id: z.string(),
            username: z.string(),
            key: z.string(),
            salt: z.string(),
            first_name: z.string(),
            last_name: z.string(),
            email: z.string(),
            password_change: z.string().optional(),
            picture: z.string().optional(),
            verified: z.number().int(),
            verification: z.string().optional(),
            email_change: z.string().optional(),
            password_change_date: z.number().optional(),
            phone_number: z.string(),
            created: z.number(),
            discord_id: z.string().optional(),
            custom_data: z.string(),
        }),
        DB,
    ),

     DiscordAccount: new Table(
        'discord_account',
        z.object({
            key: z.string(),
            id: z.string(),
            date: z.number(),
        }),
        DB,
    ),

     Members: new Table(
        'members',
        z.object({
            id: z.string(),
            title: z.string(),
            status: z.string(),
            bio: z.string().optional(),
            resume: z.string().optional(),
            board: z.number().int(),
        }),
        DB,
    ),

     Roles: new Table(
        'roles',
        z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
            rank: z.number().int(),
        }),
        DB,
    ),

     AccountRoles: new Table(
        'account_roles',
        z.object({
            account_id: z.string(),
            role_id: z.string(),
        }),
        DB,
    ),

     Permissions: new Table(
        'permissions',
        z.object({
            permission: z.string(),
            description: z.string().optional(),
        }),
        DB,
    ),

     RolePermissions: new Table(
        'role_permissions',
        z.object({
            role_id: z.string(),
            permission: z.string(),
        }),
        DB,
    ),

     Sessions: new Table(
        'sessions',
        z.object({
            id: z.string(),
            account_id: z.string().optional(),
            ip: z.string().optional(),
            userAgent: z.string().optional(),
            latestActivity: z.number().optional(),
            requests: z.number().int(),
            created: z.number().int().optional(),
            prev_url: z.string().optional(),
            custom_data: z.string(),
        }),
        DB,
    ),

     AccountSettings: new Table(
        'account_settings',
        z.object({
            account_id: z.string(),
            settings: z.string(), // JSON
        }),
        DB,
    ),

     Events: new Table(
        'events',
        z.object({
            event_key: z.string(),
            flipX: z.number().int(),
            flipY: z.number().int(),
        }),
        DB,
    ),

     Teams: new Table(
        'teams',
        z.object({
            number: z.number().int(),
            event_key: z.string(),
            watch_priority: z.number().int(),
        }),
        DB,
    ),

     Matches: new Table(
        'matches',
        z.object({
            id: z.string(),
            event_key: z.string(),
            match_number: z.number().int(),
            comp_level: z.enum(['qm', 'ef', 'qf', 'sf', 'f', 'pr']),
        }),
        DB,
    ),

     CustomMatches: new Table(
        'custom_matches',
        z.object({
            id: z.string(),
            evnet_key: z.string(),
            match_number: z.number().int(),
            comp_level: z.enum(['qm', 'ef', 'qf', 'sf', 'f', 'pr']),
            red1: z.string(),
            red2: z.string(),
            red3: z.string(),
            red4: z.string().optional(),
            blue1: z.string(),
            blue2: z.string(),
            blue3: z.string(),
            blue4: z.string().optional(),
            created: z.number().int(),
            name: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     Whiteboards: new Table(
        'whiteboards',
        z.object({
            id: z.string(),
            name: z.string(),
            board: z.string(),
            strategy_id: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     MatchScouting: new Table(
        'match_scouting',
        z.object({
            id: z.string(),
            match_id: z.string(),
            team: z.number().int(),
            scout_id: z.string().optional(),
            scout_name: z.string().optional(),
            scout_group: z.number().int().min(0).max(5),
            time: z.number().int(),
            pre_scouting: z.number().int(),
            trace: z.string(), // JSON TraceArray
            checks: z.string(), // JSON string array
            archived: z.boolean(),
        }),
        DB,
    ),

     TeamComments: new Table(
        'team_comments',
        z.object({
            id: z.string(),
            match_scouting_id: z.string(),
            account_id: z.string().optional(),
            team: z.number().int(),
            comment: z.string(),
            time: z.number().int(),
            type: z.string(),
            event_key: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     ScoutingQuestionSections: new Table(
        'scouting_question_sections',
        z.object({
            id: z.string(),
            name: z.string(),
            multiple: z.number().int(),
            date_added: z.number().int(),
            account_id: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     ScoutingQuestionGroups: new Table(
        'scouting_question_groups',
        z.object({
            id: z.string(),
            event_key: z.string(),
            section: z.string(),
            name: z.string(),
            date_added: z.number().int(),
            account_id: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     ScoutingQuestions: new Table(
        'scouting_questions',
        z.object({
            id: z.string(),
            question: z.string(),
            key: z.string(),
            description: z.string(),
            type: z.string(),
            group_id: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     ScoutingAnswers: new Table(
        'scouting_answers',
        z.object({
            id: z.string(),
            question_id: z.string(),
            answer: z.string(),
            team_number: z.number().int(),
            date: z.number().int(),
            account_id: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),


     TBARequests: new Table(
        't_b_a_requests',
        z.object({
            url: z.string(),
            response: z.string().optional(),
            updated: z.number().int(),
            update: z.number().int(),
        }),
        DB,
    ),

     Checklists: new Table(
        'checklists',
        z.object({
            id: z.string(),
            name: z.string(),
            event_key: z.string(),
            description: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     ChecklistQuestions: new Table(
        'checklist_questions',
        z.object({
            id: z.string(),
            checklist_id: z.string(),
            question: z.string(),
            interval: z.number().int().min(0),
            archived: z.boolean(),
        }),
        DB,
    ),

     ChecklistAssignments: new Table(
        'checklist_assignments',
        z.object({
            checklist_id: z.string(),
            account_id: z.string(),
        }),
        DB,
    ),

     ChecklistAnswers: new Table(
        'checklist_answers',
        z.object({
            id: z.string(),
            account_id: z.string(),
            question_id: z.string(),
            match_id: z.string(),
        }),
        DB,
    ),

     Alliances: new Table(
        'alliances',
        z.object({
            id: z.string(),
            name: z.string(),
            event_key: z.string(),
            team1: z.number().int(),
            team2: z.number().int(),
            team3: z.number().int(),
            archived: z.boolean(),
        }),
        DB,
    ),

     Strategy: new Table(
        'strategy',
        z.object({
            id: z.string(),
            name: z.string(),
            time: z.number().int(),
            created_by: z.string(),
            whiteboard_id: z.string().optional(),
            match_id: z.string().optional(),
            comment: z.string(),
            checks: z.string(),
            archived: z.boolean(),
        }),
        DB,
    ),

     TeamPictures: new Table(
        'team_pictures',
        z.object({
            team_number: z.number().int(),
            event_key: z.string(),
            picture: z.string(),
            time: z.number().int(),
            account_id: z.string(),
        }),
        DB,
    ),

     Blacklist: new Table(
        'blacklist',
        z.object({
            id: z.string(),
            ip: z.string().optional(),
            created: z.number().int(),
            account_id: z.string().optional(),
            reason: z.string().optional(),
        }),
        DB,
    ),

     MatchScoutingArchive: new Table(
        'match_scouting_archive',
        z.object({
            id: z.number().int(),
            content: z.string(),
            event_key: z.string(),
            match_number: z.number().int(),
            team_number: z.number().int(),
            comp_level: z.enum(['qm', 'ef', 'qf', 'sf', 'f', 'pr']),
            created: z.number().int(),
        }),
        DB,
    ),

     AccountNotifications: new Table(
        'account_notifications',
        z.object({
            id: z.string(),
            account_id: z.string(),
            type: z.string(),
            data: z.string(),
            message: z.string(),
            title: z.string(),
            read: z.boolean(),
            created: z.number().int(),
        }),
        DB,
    ),
}
}