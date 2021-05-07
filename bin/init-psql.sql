create extension if not exists "citext";

-- we don't know how to generate root <with-no-name> (class Root) :(
create table if not exists "access"
(
    "documentId" int not null,
    "userId" int not null,
    "dateGranted" date default current_timestamp,
    "canEdit" boolean default false not null
);

create table if not exists "components"
(
    "componentId" serial not null
        constraint components_pk
            primary key,
    "ownerId" int not null,
    "componentName" text default '' not null,
    "componentToken" text default '' not null,
    public boolean default false not null,
    source text default '{}'
);

create unique index if not exists components_componentId_uindex
	on components ("componentId");

create unique index if not exists components_componentToken_uindex
	on components ("componentToken");

create table if not exists "documents"
(
    "ownerId" int not null,
    "documentId" serial not null
        constraint documents_pk
            primary key,
    "documentTitle" text,
    public boolean default false not null,
    "documentToken" text default '' not null,
    created date default current_timestamp not null,
    edited date default current_timestamp not null,
    source text default '{}'
);

create unique index if not exists documents_documentId_uindex
	on documents ("documentId");

create unique index if not exists documents_documentToken_uindex
	on documents ("documentToken");

create table if not exists user_preferences
(
    "userId" int not null
        constraint user_preferences_pk
            primary key,
    "showGrid" boolean default false not null,
    "gridSize" int default 35 not null,
    "colouriseComponents" boolean default true not null,
    theme int default 0 not null,
    "enableTooltips" boolean default true not null,
    "enableTrackpadGestures" boolean default true not null
);

create unique index if not exists user_preferences_userId_uindex
	on user_preferences ("userId");

create table if not exists "users"
(
    "userId" serial not null
        constraint users_pk
            primary key,
    email citext not null,
    password text not null,
    joined date not null,
    identifier citext,
    "userToken" text default '' not null
);

create unique index if not exists "users_""email""_uindex"
	on "users" (email);

create unique index if not exists "users_""userId""_uindex"
	on "users" ("userId");

create unique index if not exists users_userToken_uindex
	on "users" ("userToken");

